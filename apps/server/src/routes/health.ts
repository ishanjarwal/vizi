import { Router } from "express";
import { prisma } from "../db/client.js";
import { RoomManager } from "../room/RoomManager.js";

export const healthRouter: Router = Router();

healthRouter.get("/", (_req, res) => {
  const roomManager = RoomManager.getInstance();

  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
    stats: {
      activeRooms: roomManager.getActiveRoomCount(),
      connectedClients: roomManager.getTotalConnectedClients(),
    },
  });
});

healthRouter.get("/live", (_req, res) => {
  res.status(200).json({ status: "alive" });
});

healthRouter.get("/ready", async (_req, res) => {
  try {
    // Check DB readiness
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready", database: "connected" });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Database connection failed";
    res.status(503).json({ status: "degraded", database: message });
  }
});
