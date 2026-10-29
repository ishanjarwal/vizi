import { Router } from "express";
import { RoomManager } from "../room/RoomManager.js";
import { RoomRepository } from "../db/repository.js";

export const roomsRouter: Router = Router();
const roomManager = RoomManager.getInstance();

/**
 * GET /api/rooms/:id
 * Fetches room details, active peer count, and current elements snapshot.
 */
roomsRouter.get("/:id", async (req, res, next) => {
  try {
    const roomId = req.params.id;
    if (!roomId) {
      res.status(400).json({ error: "Missing roomId parameter" });
      return;
    }

    const room = await roomManager.getOrCreateRoom(roomId);
    res.json({
      id: room.id,
      name: room.name,
      activePeers: room.getPeerCount(),
      peers: room.getPeers(),
      elementCount: room.getSnapshot().length,
      elements: room.getSnapshot(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/rooms
 * Ensures or creates a room by ID with an optional name.
 */
roomsRouter.post("/", async (req, res, next) => {
  try {
    const { id, name } = req.body;
    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "id string is required" });
      return;
    }

    const roomRecord = await RoomRepository.ensureRoom(id, name || "Untitled Canvas");
    const room = await roomManager.getOrCreateRoom(id);

    res.status(201).json({
      id: room.id,
      name: roomRecord.name,
      createdAt: roomRecord.createdAt,
    });
  } catch (err) {
    next(err);
  }
});
