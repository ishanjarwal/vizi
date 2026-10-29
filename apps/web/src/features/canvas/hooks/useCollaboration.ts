"use client";

import * as React from "react";
import { toast } from "sonner";
import { env } from "@/config";
import {
  createWSMessage,
  WS_EVENTS,
  type CanvasElement as ProtocolCanvasElement,
  type Peer,
  type UserInfo,
} from "@vizi/protocol";
import type { CanvasElement } from "../types";

const API_BASE_URL = env.NEXT_PUBLIC_API_URL;
const WS_BASE_URL = env.NEXT_PUBLIC_WS_URL;

export interface UseCollaborationOptions {
  onRemoteElementsLoaded?: (elements: CanvasElement[]) => void;
  onRemoteElementsCreated?: (elements: CanvasElement[]) => void;
  onRemoteElementsUpdated?: (elements: CanvasElement[]) => void;
  onRemoteElementsDeleted?: (elementIds: string[]) => void;
  onLocalElementsSync?: () => void;
}

export function useCollaboration({
  onRemoteElementsLoaded,
  onRemoteElementsCreated,
  onRemoteElementsUpdated,
  onRemoteElementsDeleted,
  onLocalElementsSync,
}: UseCollaborationOptions = {}) {
  // Directly initialize roomId from URL search parameter
  const [roomId, setRoomId] = React.useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("room")?.trim() || null;
  });

  const [isConnected, setIsConnected] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [peers, setPeers] = React.useState<Peer[]>([]);
  const [selfUser, setSelfUser] = React.useState<UserInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const socketRef = React.useRef<WebSocket | null>(null);
  const connectedRoomIdRef = React.useRef<string | null>(null);
  const lastCursorSendRef = React.useRef<number>(0);
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const connectToRoomRef = React.useRef<((id: string) => void) | null>(null);

  const selfUserRef = React.useRef<UserInfo | null>(selfUser);
  const roomIdRef = React.useRef<string | null>(roomId);

  React.useEffect(() => {
    selfUserRef.current = selfUser;
  }, [selfUser]);

  React.useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // References to callbacks so effects don't constantly recreate
  const callbacksRef = React.useRef({
    onRemoteElementsLoaded,
    onRemoteElementsCreated,
    onRemoteElementsUpdated,
    onRemoteElementsDeleted,
    onLocalElementsSync,
  });

  React.useEffect(() => {
    callbacksRef.current = {
      onRemoteElementsLoaded,
      onRemoteElementsCreated,
      onRemoteElementsUpdated,
      onRemoteElementsDeleted,
      onLocalElementsSync,
    };
  });

  // Calculate shareable URL
  const shareUrl = React.useMemo(() => {
    if (typeof window === "undefined" || !roomId) return "";
    const origin = window.location.origin;
    return `${origin}?room=${encodeURIComponent(roomId)}`;
  }, [roomId]);

  /**
   * Connects to WebSocket server and sends room:join frame.
   */
  const connectToRoom = React.useCallback((targetRoomId: string) => {
    if (!targetRoomId) return;

    // Avoid duplicate connection if already connected/connecting to the same room
    if (
      connectedRoomIdRef.current === targetRoomId &&
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    connectedRoomIdRef.current = targetRoomId;
    setIsConnecting(true);

    const ws = new WebSocket(WS_BASE_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      if (socketRef.current !== ws) return;

      setIsConnected(true);
      setIsConnecting(false);

      // Stable persistent user profile per browser instance
      let storedUserId: string | undefined;
      let storedName: string | undefined;
      try {
        storedUserId = localStorage.getItem("vizi_user_id") || undefined;
        if (!storedUserId) {
          storedUserId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
          localStorage.setItem("vizi_user_id", storedUserId);
        }
        storedName = localStorage.getItem("vizi_user_name") || undefined;
      } catch {
        storedUserId = undefined;
      }

      // Join room message
      const joinMsg = createWSMessage(WS_EVENTS.ROOM_JOIN, targetRoomId, storedUserId || "client", {
        roomId: targetRoomId,
        user: {
          id: storedUserId,
          name: storedName,
        },
      });

      ws.send(JSON.stringify(joinMsg));
    };

    ws.onmessage = (event: MessageEvent) => {
      if (socketRef.current !== ws) return;

      try {
        const raw = JSON.parse(event.data as string);

        switch (raw.type) {
          case WS_EVENTS.ROOM_JOINED: {
            const { self, peers: currentPeers, elements } = raw.payload;
            setSelfUser(self);
            setPeers(currentPeers.filter((p: Peer) => p.id !== self.id));

            try {
              localStorage.setItem("vizi_user_id", self.id);
              localStorage.setItem("vizi_user_name", self.name);
            } catch {
              // Ignore
            }

            if (Array.isArray(elements) && elements.length > 0) {
              callbacksRef.current.onRemoteElementsLoaded?.(elements);
            } else {
              // If server room has no elements, sync any pre-existing local elements to the room
              callbacksRef.current.onLocalElementsSync?.();
            }
            break;
          }

          case WS_EVENTS.ROOM_PEER_JOINED: {
            const { peer } = raw.payload;
            setPeers((prev) => {
              if (prev.some((p) => p.id === peer.id)) return prev;
              return [...prev, peer];
            });
            toast.info(`${peer.name} joined the canvas`);
            break;
          }

          case WS_EVENTS.ROOM_PEER_LEFT: {
            const { peerId } = raw.payload;
            setPeers((prev) => prev.filter((p) => p.id !== peerId));
            break;
          }

          case WS_EVENTS.PRESENCE_CURSOR_BROADCAST: {
            const { peerId, x, y, isDrawing } = raw.payload;
            setPeers((prev) =>
              prev.map((p) =>
                p.id === peerId
                  ? {
                      ...p,
                      cursor: {
                        x,
                        y,
                        isDrawing,
                        lastActive: Date.now(),
                      },
                    }
                  : p,
              ),
            );
            break;
          }

          case WS_EVENTS.ELEMENT_CREATED: {
            const { elements } = raw.payload;
            if (Array.isArray(elements)) {
              callbacksRef.current.onRemoteElementsCreated?.(elements);
            }
            break;
          }

          case WS_EVENTS.ELEMENT_UPDATED: {
            const { elements } = raw.payload;
            if (Array.isArray(elements)) {
              callbacksRef.current.onRemoteElementsUpdated?.(elements);
            }
            break;
          }

          case WS_EVENTS.ELEMENT_DELETED: {
            const { elementIds } = raw.payload;
            if (Array.isArray(elementIds)) {
              callbacksRef.current.onRemoteElementsDeleted?.(elementIds);
            }
            break;
          }

          case WS_EVENTS.ERROR: {
            console.warn("WebSocket Server Error:", raw.payload);
            break;
          }
        }
      } catch (err) {
        console.error("Error processing WebSocket frame:", err);
      }
    };

    ws.onclose = (event) => {
      if (socketRef.current !== ws) return;

      setIsConnected(false);
      setIsConnecting(false);
      connectedRoomIdRef.current = null;

      // Auto-reconnect if unexpectedly closed and still in a room
      if (!event.wasClean && targetRoomId) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectToRoomRef.current?.(targetRoomId);
        }, 3000);
      }
    };

    ws.onerror = (err) => {
      if (socketRef.current !== ws) return;
      console.error("WebSocket connection error:", err);
    };
  }, []);

  React.useEffect(() => {
    connectToRoomRef.current = connectToRoom;
  }, [connectToRoom]);

  // Auto-connect to room on mount if roomId was in URL
  React.useEffect(() => {
    if (roomId) {
      connectToRoom(roomId);
    }
  }, [roomId, connectToRoom]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  /**
   * Creates a room in backend via REST API, sets the URL param, and connects.
   */
  const createRoom = React.useCallback(async () => {
    setIsConnecting(true);

    try {
      // Generate unique room slug
      const uniqueId = `room-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      // Call backend POST /api/rooms to persist/ensure room in DB
      try {
        const res = await fetch(`${API_BASE_URL}/api/rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: uniqueId, name: "Untitled Canvas" }),
        });
        if (!res.ok) {
          console.warn("Failed to create room via REST, falling back to direct WS join");
        }
      } catch (err) {
        console.warn("Backend REST unreachable, proceeding with direct WS join:", err);
      }

      // Update browser URL query string without reloading page
      if (typeof window !== "undefined") {
        const newUrl = `${window.location.pathname}?room=${uniqueId}`;
        window.history.pushState({ room: uniqueId }, "", newUrl);
      }

      setRoomId(uniqueId);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error creating room:", err);
      toast.error("Could not create collaboration room");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Broadcasts moving cursor coordinates (throttled to ~25fps / 40ms).
   */
  const broadcastCursor = React.useCallback(
    (x: number, y: number, isDrawing?: boolean) => {
      const activeRoom = roomIdRef.current;
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !activeRoom) {
        return;
      }

      const now = Date.now();
      if (now - lastCursorSendRef.current < 40) {
        return;
      }
      lastCursorSendRef.current = now;

      const msg = createWSMessage(
        WS_EVENTS.PRESENCE_CURSOR,
        activeRoom,
        selfUserRef.current?.id || "client",
        {
          x,
          y,
          isDrawing,
        },
      );

      socketRef.current.send(JSON.stringify(msg));
    },
    [],
  );

  /**
   * Broadcasts created canvas elements.
   */
  const broadcastElementCreate = React.useCallback(
    (elementsToCreate: CanvasElement[]) => {
      const activeRoom = roomIdRef.current;
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !activeRoom) {
        return;
      }

      const sender = selfUserRef.current?.id || "client";
      const normalized: ProtocolCanvasElement[] = elementsToCreate.map((el) => ({
        ...el,
        version: el.version ?? 1,
        updatedAt: el.updatedAt ?? Date.now(),
        createdBy: el.createdBy ?? sender,
        isDeleted: Boolean(el.isDeleted),
      })) as ProtocolCanvasElement[];

      const opId = `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const msg = createWSMessage(WS_EVENTS.ELEMENT_CREATE, activeRoom, sender, {
        opId,
        elements: normalized,
      });

      socketRef.current.send(JSON.stringify(msg));
    },
    [],
  );

  /**
   * Broadcasts updated canvas elements.
   */
  const broadcastElementUpdate = React.useCallback(
    (elementsToUpdate: CanvasElement[]) => {
      const activeRoom = roomIdRef.current;
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !activeRoom) {
        return;
      }

      const sender = selfUserRef.current?.id || "client";
      const normalized: ProtocolCanvasElement[] = elementsToUpdate.map((el) => ({
        ...el,
        version: typeof el.version === "number" ? el.version + 1 : 2,
        updatedAt: Date.now(),
        createdBy: el.createdBy ?? sender,
        isDeleted: Boolean(el.isDeleted),
      })) as ProtocolCanvasElement[];

      const opId = `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const msg = createWSMessage(WS_EVENTS.ELEMENT_UPDATE, activeRoom, sender, {
        opId,
        elements: normalized,
      });

      socketRef.current.send(JSON.stringify(msg));
    },
    [],
  );

  /**
   * Broadcasts deleted element IDs.
   */
  const broadcastElementDelete = React.useCallback(
    (elementIds: string[]) => {
      const activeRoom = roomIdRef.current;
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !activeRoom) {
        return;
      }

      const sender = selfUserRef.current?.id || "client";
      const opId = `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const msg = createWSMessage(WS_EVENTS.ELEMENT_DELETE, activeRoom, sender, {
        opId,
        elementIds,
      });

      socketRef.current.send(JSON.stringify(msg));
    },
    [],
  );

  return {
    roomId,
    isConnected,
    isConnecting,
    peers,
    selfUser,
    isModalOpen,
    setIsModalOpen,
    shareUrl,
    createRoom,
    broadcastCursor,
    broadcastElementCreate,
    broadcastElementUpdate,
    broadcastElementDelete,
  };
}
