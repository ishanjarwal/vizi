/**
 * WebSocket event name catalog for Vizi real-time collaboration.
 */

export const WS_EVENTS = {
  // Client -> Server
  ROOM_JOIN: "room:join",
  PRESENCE_CURSOR: "presence:cursor",
  ELEMENT_CREATE: "element:create",
  ELEMENT_UPDATE: "element:update",
  ELEMENT_DELETE: "element:delete",
  SYNC_REQUEST: "sync:request",
  HEARTBEAT_PING: "heartbeat:ping",

  // Server -> Client
  ROOM_JOINED: "room:joined",
  ROOM_PEER_JOINED: "room:peer_joined",
  ROOM_PEER_LEFT: "room:peer_left",
  PRESENCE_CURSOR_BROADCAST: "presence:cursor",
  ELEMENT_CREATED: "element:created",
  ELEMENT_UPDATED: "element:updated",
  ELEMENT_DELETED: "element:deleted",
  SYNC_RESPONSE: "sync:response",
  HEARTBEAT_PONG: "heartbeat:pong",
  ERROR: "error",
} as const;

export type WSEventType = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];
