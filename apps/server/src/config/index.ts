import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env if present
dotenv.config();

const ConfigSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string(),
  CORS_ORIGIN: z.string(),
  WS_PATH: z.string(),
  WS_HEARTBEAT_INTERVAL_MS: z.coerce.number(),
  WS_HEARTBEAT_TIMEOUT_MS: z.coerce.number(),
  WS_MAX_PAYLOAD_BYTES: z.coerce.number(),
  WS_MAX_MESSAGES_PER_SEC: z.coerce.number(),
  DB_FLUSH_INTERVAL_MS: z.coerce.number(),
  ROOM_IDLE_TIMEOUT_MS: z.coerce.number(),
  ROOM_CLEANUP_CRON: z.string(),
  ROOM_RETENTION_MS: z.coerce.number(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

function loadConfig(): Config {
  const result = ConfigSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    throw new Error("Invalid server configuration");
  }
  return result.data;
}

export const config = loadConfig();
