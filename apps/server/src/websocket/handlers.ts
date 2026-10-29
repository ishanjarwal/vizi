import { randomUUID } from "node:crypto";
import {
  createErrorMessage,
  createWSMessage,
  InboundMessage,
  resolveUserInfo,
  serializeWSMessage,
  WS_EVENTS,
} from "@vizi/protocol";
import { AuthenticatedClient } from "./types.js";
import { RoomManager } from "../room/RoomManager.js";

const roomManager = RoomManager.getInstance();

export async function handleInboundMessage(
  client: AuthenticatedClient,
  message: InboundMessage,
): Promise<void> {
  switch (message.type) {
    case WS_EVENTS.ROOM_JOIN:
      await handleRoomJoin(client, message.payload);
      break;

    case WS_EVENTS.PRESENCE_CURSOR:
      handlePresenceCursor(client, message.payload);
      break;

    case WS_EVENTS.ELEMENT_CREATE:
      handleElementCreate(client, message.payload);
      break;

    case WS_EVENTS.ELEMENT_UPDATE:
      handleElementUpdate(client, message.payload);
      break;

    case WS_EVENTS.ELEMENT_DELETE:
      handleElementDelete(client, message.payload);
      break;

    case WS_EVENTS.SYNC_REQUEST:
      await handleSyncRequest(client, message.payload);
      break;

    case WS_EVENTS.HEARTBEAT_PING:
      handleHeartbeatPing(client, message.payload);
      break;

    default:
      sendToClient(
        client,
        createErrorMessage(
          client.roomId || "unknown",
          "UNKNOWN_EVENT",
          `Unhandled event type: ${(message as { type: string }).type}`,
        ),
      );
  }
}

/**
 * Handles client joining a collaborative room.
 */
async function handleRoomJoin(
  client: AuthenticatedClient,
  payload: { roomId: string; user?: { id?: string; name?: string; color?: string } },
): Promise<void> {
  const { roomId, user: rawUser } = payload;

  // If already in a room, leave old room first
  if (client.roomId && client.peerId) {
    cleanupClientSession(client);
  }

  // Resolve user identification (name input or random default, color, ID)
  const peerId = rawUser?.id && rawUser.id.trim().length > 0 ? rawUser.id.trim() : randomUUID();
  const user = resolveUserInfo({
    id: peerId,
    name: rawUser?.name,
    color: rawUser?.color,
  });

  const room = await roomManager.getOrCreateRoom(roomId);
  client.roomId = roomId;
  client.peerId = user.id;
  client.user = user;

  const peer = room.addPeer(user, client);

  // Send current snapshot and peers list to joining peer
  const joinResponse = createWSMessage(WS_EVENTS.ROOM_JOINED, roomId, "server", {
    roomId,
    self: user,
    peers: room.getPeers(),
    elements: room.getSnapshot(),
  });
  sendToClient(client, joinResponse);

  // Broadcast peer joined to everyone else in the room
  const peerJoinedNotice = createWSMessage(WS_EVENTS.ROOM_PEER_JOINED, roomId, user.id, {
    peer,
  });
  room.broadcast(peerJoinedNotice, user.id);
}

/**
 * Handles cursor position updates and broadcasts to peers.
 */
function handlePresenceCursor(
  client: AuthenticatedClient,
  payload: { x: number; y: number; isDrawing?: boolean },
): void {
  if (!client.roomId || !client.peerId) {
    sendToClient(
      client,
      createErrorMessage("unknown", "NOT_IN_ROOM", "Must join a room before broadcasting presence"),
    );
    return;
  }

  const room = roomManager.getRoomInMemory(client.roomId);
  if (!room) return;

  room.updateCursor(client.peerId, payload.x, payload.y, payload.isDrawing);

  // Broadcast ephemeral cursor coordinates to other peers
  const broadcastMsg = createWSMessage(WS_EVENTS.PRESENCE_CURSOR_BROADCAST, client.roomId, client.peerId, {
    peerId: client.peerId,
    x: payload.x,
    y: payload.y,
    isDrawing: payload.isDrawing,
  });

  room.broadcast(broadcastMsg, client.peerId);
}

/**
 * Handles creation of new canvas elements.
 */
function handleElementCreate(
  client: AuthenticatedClient,
  payload: { opId: string; elements: Array<any> },
): void {
  if (!client.roomId || !client.peerId) {
    sendToClient(
      client,
      createErrorMessage("unknown", "NOT_IN_ROOM", "Must join a room before creating elements"),
    );
    return;
  }

  const room = roomManager.getRoomInMemory(client.roomId);
  if (!room) return;

  const { applied, isDuplicate } = room.applyElementCreates(
    payload.elements,
    payload.opId,
    client.peerId,
  );

  if (isDuplicate || applied.length === 0) return;

  // Broadcast created elements to other peers
  const broadcastMsg = createWSMessage(WS_EVENTS.ELEMENT_CREATED, client.roomId, client.peerId, {
    opId: payload.opId,
    senderId: client.peerId,
    elements: applied,
  });

  room.broadcast(broadcastMsg, client.peerId);
}

/**
 * Handles mutations of existing canvas elements with LWW conflict resolution.
 */
function handleElementUpdate(
  client: AuthenticatedClient,
  payload: { opId: string; elements: Array<any> },
): void {
  if (!client.roomId || !client.peerId) {
    sendToClient(
      client,
      createErrorMessage("unknown", "NOT_IN_ROOM", "Must join a room before updating elements"),
    );
    return;
  }

  const room = roomManager.getRoomInMemory(client.roomId);
  if (!room) return;

  const { applied, conflicts, isDuplicate } = room.applyElementUpdates(
    payload.elements,
    payload.opId,
  );

  if (isDuplicate) return;

  // Broadcast accepted updates to peers
  if (applied.length > 0) {
    const broadcastMsg = createWSMessage(WS_EVENTS.ELEMENT_UPDATED, client.roomId, client.peerId, {
      opId: payload.opId,
      senderId: client.peerId,
      elements: applied,
    });
    room.broadcast(broadcastMsg, client.peerId);
  }

  // If there were stale updates that lost conflict resolution, send back the winning elements
  if (conflicts.length > 0) {
    const reconcileMsg = createWSMessage(WS_EVENTS.ELEMENT_UPDATED, client.roomId, "server", {
      opId: `reconcile-${payload.opId}`,
      senderId: "server",
      elements: conflicts,
    });
    sendToClient(client, reconcileMsg);
  }
}

/**
 * Handles element soft deletions (tombstones).
 */
function handleElementDelete(
  client: AuthenticatedClient,
  payload: { opId: string; elementIds: string[] },
): void {
  if (!client.roomId || !client.peerId) {
    sendToClient(
      client,
      createErrorMessage("unknown", "NOT_IN_ROOM", "Must join a room before deleting elements"),
    );
    return;
  }

  const room = roomManager.getRoomInMemory(client.roomId);
  if (!room) return;

  const { deleted, isDuplicate } = room.applyElementDeletes(
    payload.elementIds,
    payload.opId,
    client.peerId,
  );

  if (isDuplicate || deleted.length === 0) return;

  // Broadcast tombstone deletions to other peers
  const broadcastMsg = createWSMessage(WS_EVENTS.ELEMENT_DELETED, client.roomId, client.peerId, {
    opId: payload.opId,
    senderId: client.peerId,
    elementIds: deleted,
  });

  room.broadcast(broadcastMsg, client.peerId);
}

/**
 * Handles client state synchronization requests.
 */
async function handleSyncRequest(
  client: AuthenticatedClient,
  payload: { roomId: string },
): Promise<void> {
  const room = await roomManager.getOrCreateRoom(payload.roomId);

  const syncResponse = createWSMessage(WS_EVENTS.SYNC_RESPONSE, payload.roomId, "server", {
    elements: room.getSnapshot(),
    serverTimestamp: Date.now(),
  });

  sendToClient(client, syncResponse);
}

/**
 * Responds to ping with pong frame.
 */
function handleHeartbeatPing(
  client: AuthenticatedClient,
  payload: { clientTime: number },
): void {
  const pongMsg = createWSMessage(
    WS_EVENTS.HEARTBEAT_PONG,
    client.roomId || "none",
    "server",
    {
      clientTime: payload.clientTime,
      serverTime: Date.now(),
    },
  );
  sendToClient(client, pongMsg);
}

/**
 * Cleans up a client's session when disconnecting or switching rooms.
 */
export function cleanupClientSession(client: AuthenticatedClient): void {
  const { roomId, peerId } = client;
  if (!roomId || !peerId) return;

  const room = roomManager.getRoomInMemory(roomId);
  if (room) {
    room.removePeer(peerId);

    // Broadcast peer left notification to remaining peers
    const peerLeftNotice = createWSMessage(WS_EVENTS.ROOM_PEER_LEFT, roomId, peerId, {
      peerId,
    });
    room.broadcast(peerLeftNotice);
  }

  client.roomId = undefined;
  client.peerId = undefined;
  client.user = undefined;
}

function sendToClient(client: AuthenticatedClient, message: any): void {
  if (client.readyState === client.OPEN) {
    try {
      client.send(serializeWSMessage(message));
    } catch (err) {
      console.error(`Failed to send message to client:`, err);
    }
  }
}
