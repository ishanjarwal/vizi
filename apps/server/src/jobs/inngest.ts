import { Inngest } from "inngest";
import { config } from "../config/index.js";

/**
 * Shared Inngest client instance for Vizi server background workers.
 */
export const inngest = new Inngest({
  id: "vizi-server",
  isDev: config.NODE_ENV !== "production" || Boolean(process.env.INNGEST_DEV),
  eventKey: config.INNGEST_EVENT_KEY,
});
