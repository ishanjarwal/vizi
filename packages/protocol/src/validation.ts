import { ZodError } from "zod";
import {
  InboundMessage,
  InboundMessageSchema,
  BaseWSMessage,
} from "./messages.js";
import { WS_EVENTS, WSEventType } from "./events.js";

export interface ParseSuccess {
  success: true;
  message: InboundMessage;
}

export interface ParseError {
  success: false;
  error: string;
  details?: unknown;
}

export type ParseResult = ParseSuccess | ParseError;

/**
 * Validates and safely parses an incoming raw string or JSON frame from a WebSocket.
 */
export function parseClientMessage(raw: unknown): ParseResult {
  try {
    let parsed: unknown = raw;
    if (typeof raw === "string") {
      parsed = JSON.parse(raw);
    }

    if (!parsed || typeof parsed !== "object") {
      return {
        success: false,
        error: "Invalid frame format: expected JSON object",
      };
    }

    const result = InboundMessageSchema.safeParse(parsed);
    if (!result.success) {
      const errorMsg = formatZodError(result.error);
      return {
        success: false,
        error: `Validation error: ${errorMsg}`,
        details: result.error.flatten(),
      };
    }

    return {
      success: true,
      message: result.data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Malformed JSON frame";
    return {
      success: false,
      error: `JSON parse error: ${message}`,
    };
  }
}

/**
 * Constructs a fully-typed outbound WebSocket message.
 */
export function createWSMessage<TType extends WSEventType, TPayload>(
  type: TType,
  roomId: string,
  senderId: string,
  payload: TPayload,
): BaseWSMessage<TType, TPayload> {
  return {
    type,
    roomId,
    senderId,
    timestamp: Date.now(),
    payload,
  };
}

/**
 * Serializes a WebSocket message to JSON.
 */
export function serializeWSMessage<TType extends WSEventType, TPayload>(
  message: BaseWSMessage<TType, TPayload>,
): string {
  return JSON.stringify(message);
}

/**
 * Creates an error response message.
 */
export function createErrorMessage(
  roomId: string,
  code: string,
  message: string,
  details?: unknown,
): BaseWSMessage<
  typeof WS_EVENTS.ERROR,
  { code: string; message: string; details?: unknown }
> {
  return createWSMessage(WS_EVENTS.ERROR, roomId, "server", {
    code,
    message,
    details,
  });
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
}
