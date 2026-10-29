import { createServer } from "node:http";
import { createApp } from "./app.js";
import { setupWebSocketServer } from "./websocket/server.js";
import { config } from "./config/index.js";
import { RoomManager } from "./room/RoomManager.js";
import { disconnectPrisma } from "./db/client.js";

async function bootstrap() {
  const app = createApp();
  const server = createServer(app);

  const { wss, heartbeatManager } = setupWebSocketServer(server);
  const roomManager = RoomManager.getInstance();

  server.listen(config.PORT, () => {
    console.log(`🚀 Vizi Real-Time Server running on port ${config.PORT} [${config.NODE_ENV}]`);
    console.log(`🔌 WebSocket Gateway ready at ws://localhost:${config.PORT}${config.WS_PATH}`);
  });

  // Graceful Shutdown
  let isShuttingDown = false;
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n🛑 [${signal}] Gracefully shutting down Vizi server...`);

    // 1. Stop keepalive timer
    heartbeatManager.stop();

    // 2. Close active WebSocket connections
    wss.clients.forEach((client) => {
      client.close(1001, "Server shutting down");
    });
    wss.close();

    // 3. Flush in-memory rooms to database
    console.log("💾 Flushing pending room changes to database...");
    await roomManager.shutdown();

    // 4. Close database connection
    await disconnectPrisma();

    // 5. Close HTTP server
    server.close(() => {
      console.log("✅ Server shutdown complete.");
      process.exit(0);
    });

    // Force exit after 10s if hung
    setTimeout(() => {
      console.error("⚠️ Forcefully shutting down after timeout");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
}

bootstrap().catch((err) => {
  console.error("💥 Fatal error during server bootstrap:", err);
  process.exit(1);
});
