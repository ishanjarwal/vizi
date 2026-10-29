import { WebSocketServer } from "ws";
import { AuthenticatedClient } from "./types.js";
import { config } from "../config/index.js";

/**
 * Manages WebSocket ping/pong keepalive frames to detect and terminate zombie connections.
 */
export class HeartbeatManager {
  private timer: NodeJS.Timeout | null = null;

  public start(wss: WebSocketServer): void {
    this.timer = setInterval(() => {
      for (const client of wss.clients) {
        const authClient = client as AuthenticatedClient;
        if (authClient.isAlive === false) {
          console.log(`[WebSocket] Terminating zombie connection for peer ${authClient.peerId || "unknown"}`);
          authClient.terminate();
          continue;
        }

        authClient.isAlive = false;
        authClient.ping();
      }
    }, config.WS_HEARTBEAT_INTERVAL_MS);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
