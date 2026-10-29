import express, { Express } from "express";
import { serve } from "inngest/express";
import { helmetMiddleware, corsMiddleware, httpRateLimiter } from "./middleware/security.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.js";
import { roomsRouter } from "./routes/rooms.js";
import { inngest, inngestFunctions } from "./jobs/index.js";

export function createApp(): Express {
  const app = express();

  // Security Headers & CORS
  app.use(helmetMiddleware);
  app.use(corsMiddleware);

  // Body parser with size limits
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Inngest background workers endpoint
  app.use("/api/inngest", serve({ client: inngest, functions: inngestFunctions }));

  // REST Rate Limiter
  app.use(httpRateLimiter);

  // Routes
  app.use("/health", healthRouter);
  app.use("/api/rooms", roomsRouter);

  // Fallback 404
  app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
