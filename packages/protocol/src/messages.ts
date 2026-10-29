import { z } from "zod";
import { WS_EVENTS } from "./events.js";
import { CanvasElementSchema } from "./elements.js";
import { PeerSchema, UserInfoSchema } from "./user.js";

/**
 * Standard envelope for all WebSocket messages.
 */
export interface BaseWSMessage<
  TType extends string = string,
  TPayload = unknown,
> {
  type: TType;
  roomId: string;
  senderId: string;
  timestamp: number;
  payload: TPayload;
}

// ==========================================
// Client Payloads
// ==========================================

export const RoomJoinPayloadSchema = z.object({
  roomId: z.string().min(1).max(100),
  user: z
    .object({
      id: z.string().optional(),
      name: z.string().max(50).optional(),
      color: z.string().optional(),
    })
    .optional(),
});
export type RoomJoinPayload = z.infer<typeof RoomJoinPayloadSchema>;

export const PresenceCursorPayloadSchema = z.object({
  x: z.number(),
  y: z.number(),
  isDrawing: z.boolean().optional(),
});
export type PresenceCursorPayload = z.infer<typeof PresenceCursorPayloadSchema>;

export const ElementCreatePayloadSchema = z.object({
  opId: z.string().min(1).max(100),
  elements: z.array(CanvasElementSchema).min(1).max(500),
});
export type ElementCreatePayload = z.infer<typeof ElementCreatePayloadSchema>;

export const ElementUpdatePayloadSchema = z.object({
  opId: z.string().min(1).max(100),
  elements: z.array(CanvasElementSchema).min(1).max(500),
});
export type ElementUpdatePayload = z.infer<typeof ElementUpdatePayloadSchema>;

export const ElementDeletePayloadSchema = z.object({
  opId: z.string().min(1).max(100),
  elementIds: z.array(z.string().min(1)).min(1).max(500),
});
export type ElementDeletePayload = z.infer<typeof ElementDeletePayloadSchema>;

export const SyncRequestPayloadSchema = z.object({
  roomId: z.string().min(1).max(100),
  lastKnownVersion: z.number().int().nonnegative().optional(),
});
export type SyncRequestPayload = z.infer<typeof SyncRequestPayloadSchema>;

export const HeartbeatPingPayloadSchema = z.object({
  clientTime: z.number(),
});
export type HeartbeatPingPayload = z.infer<typeof HeartbeatPingPayloadSchema>;

// ==========================================
// Server Payloads
// ==========================================

export const RoomJoinedPayloadSchema = z.object({
  roomId: z.string(),
  self: UserInfoSchema,
  peers: z.array(PeerSchema),
  elements: z.array(CanvasElementSchema),
});
export type RoomJoinedPayload = z.infer<typeof RoomJoinedPayloadSchema>;

export const PeerJoinedPayloadSchema = z.object({
  peer: PeerSchema,
});
export type PeerJoinedPayload = z.infer<typeof PeerJoinedPayloadSchema>;

export const PeerLeftPayloadSchema = z.object({
  peerId: z.string(),
});
export type PeerLeftPayload = z.infer<typeof PeerLeftPayloadSchema>;

export const PresenceCursorBroadcastPayloadSchema = z.object({
  peerId: z.string(),
  x: z.number(),
  y: z.number(),
  isDrawing: z.boolean().optional(),
});
export type PresenceCursorBroadcastPayload = z.infer<
  typeof PresenceCursorBroadcastPayloadSchema
>;

export const ElementsMutatedPayloadSchema = z.object({
  opId: z.string(),
  senderId: z.string(),
  elements: z.array(CanvasElementSchema),
});
export type ElementsMutatedPayload = z.infer<
  typeof ElementsMutatedPayloadSchema
>;

export const ElementsDeletedPayloadSchema = z.object({
  opId: z.string(),
  senderId: z.string(),
  elementIds: z.array(z.string()),
});
export type ElementsDeletedPayload = z.infer<
  typeof ElementsDeletedPayloadSchema
>;

export const SyncResponsePayloadSchema = z.object({
  elements: z.array(CanvasElementSchema),
  serverTimestamp: z.number(),
});
export type SyncResponsePayload = z.infer<typeof SyncResponsePayloadSchema>;

export const HeartbeatPongPayloadSchema = z.object({
  clientTime: z.number(),
  serverTime: z.number(),
});
export type HeartbeatPongPayload = z.infer<typeof HeartbeatPongPayloadSchema>;

export const ErrorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;

// ==========================================
// Message Schemas for Inbound Routing
// ==========================================

function createClientMessageSchema<T extends string, P extends z.ZodTypeAny>(
  typeLiteral: T,
  payloadSchema: P,
) {
  return z.object({
    type: z.literal(typeLiteral),
    roomId: z.string().min(1).max(100),
    senderId: z.string().min(1).max(100),
    timestamp: z.number().default(() => Date.now()),
    payload: payloadSchema,
  });
}

export const ClientJoinMessageSchema = createClientMessageSchema(
  WS_EVENTS.ROOM_JOIN,
  RoomJoinPayloadSchema,
);

export const ClientCursorMessageSchema = createClientMessageSchema(
  WS_EVENTS.PRESENCE_CURSOR,
  PresenceCursorPayloadSchema,
);

export const ClientCreateMessageSchema = createClientMessageSchema(
  WS_EVENTS.ELEMENT_CREATE,
  ElementCreatePayloadSchema,
);

export const ClientUpdateMessageSchema = createClientMessageSchema(
  WS_EVENTS.ELEMENT_UPDATE,
  ElementUpdatePayloadSchema,
);

export const ClientDeleteMessageSchema = createClientMessageSchema(
  WS_EVENTS.ELEMENT_DELETE,
  ElementDeletePayloadSchema,
);

export const ClientSyncMessageSchema = createClientMessageSchema(
  WS_EVENTS.SYNC_REQUEST,
  SyncRequestPayloadSchema,
);

export const ClientHeartbeatMessageSchema = createClientMessageSchema(
  WS_EVENTS.HEARTBEAT_PING,
  HeartbeatPingPayloadSchema,
);

/**
 * Union schema for all incoming client messages.
 */
export const InboundMessageSchema = z.discriminatedUnion("type", [
  ClientJoinMessageSchema,
  ClientCursorMessageSchema,
  ClientCreateMessageSchema,
  ClientUpdateMessageSchema,
  ClientDeleteMessageSchema,
  ClientSyncMessageSchema,
  ClientHeartbeatMessageSchema,
]);

export type InboundMessage = z.infer<typeof InboundMessageSchema>;
