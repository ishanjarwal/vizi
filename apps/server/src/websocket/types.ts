import { WebSocket } from "ws";
import { UserInfo } from "@vizi/protocol";

export interface AuthenticatedClient extends WebSocket {
  isAlive: boolean;
  peerId?: string;
  roomId?: string;
  user?: UserInfo;
  messageCount: number;
  lastRateLimitReset: number;
}
