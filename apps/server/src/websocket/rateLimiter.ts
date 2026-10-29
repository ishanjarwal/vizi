import { AuthenticatedClient } from "./types.js";
import { config } from "../config/index.js";

/**
 * Enforces per-client message frequency limits to prevent socket flooding DoS.
 */
export function checkRateLimit(client: AuthenticatedClient): boolean {
  const now = Date.now();
  const windowDurationMs = 1000;

  if (now - client.lastRateLimitReset > windowDurationMs) {
    client.lastRateLimitReset = now;
    client.messageCount = 1;
    return true;
  }

  client.messageCount += 1;
  return client.messageCount <= config.WS_MAX_MESSAGES_PER_SEC;
}
