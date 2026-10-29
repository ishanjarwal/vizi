import { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { createErrorMessage, parseClientMessage, serializeWSMessage } from "@vizi/protocol";
import { config } from "../config/index.js";
import { AuthenticatedClient } from "./types.js";
import { checkRateLimit } from "./rateLimiter.js";
import { HeartbeatManager } from "./heartbeat.js";
import { cleanupClientSession, handleInboundMessage } from "./handlers.js";

export function setupWebSocketServer(httpServer: HttpServer): {
  wss: WebSocketServer;
  heartbeatManager: HeartbeatManager;
} {
  const wss = new WebSocketServer({
    server: httpServer,
    path: config.WS_PATH,
    maxPayload: config.WS_MAX_PAYLOAD_BYTES,
  });

  const heartbeatManager = new HeartbeatManager();
  heartbeatManager.start(wss);

  wss.on("connection", (socket: WebSocket, req) => {
    const client = socket as AuthenticatedClient;
    client.isAlive = true;
    client.messageCount = 0;
    client.lastRateLimitReset = Date.now();

    // Pong response handler for keepalives
    client.on("pong", () => {
      client.isAlive = true;
    });

    // Inbound frame handler
    client.on("message", async (data: Buffer | string) => {
      // 1. Enforce per-client message rate limiting
      if (!checkRateLimit(client)) {
        const errorMsg = createErrorMessage(
          client.roomId || "unknown",
          "RATE_LIMIT_EXCEEDED",
          "Too many messages. Slow down.",
        );
        client.send(serializeWSMessage(errorMsg));
        return;
      }

      // 2. Validate and parse payload strictly via Zod schema in @vizi/protocol
      const parseResult = parseClientMessage(data.toString());
      if (!parseResult.success) {
        const errorMsg = createErrorMessage(
          client.roomId || "unknown",
          "INVALID_PAYLOAD",
          parseResult.error,
          parseResult.details,
        );
        client.send(serializeWSMessage(errorMsg));
        return;
      }

      // 3. Dispatch to type-safe handlers
      try {
        await handleInboundMessage(client, parseResult.message);
      } catch (err: unknown) {
        console.error("Unhandled error in message handler:", err);
        const errorMsg = createErrorMessage(
          client.roomId || "unknown",
          "INTERNAL_ERROR",
          "An unexpected server error occurred while processing the event",
        );
        client.send(serializeWSMessage(errorMsg));
      }
    });

    // Clean disconnect handling
    client.on("close", () => {
      cleanupClientSession(client);
    });

    client.on("error", (err) => {
      console.error(`Socket error on client [peerId=${client.peerId || "unknown"}]:`, err);
      cleanupClientSession(client);
    });
  });

  return { wss, heartbeatManager };
}
