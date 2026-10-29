import { RoomRepository } from "../db/repository.js";
import { RoomManager } from "./RoomManager.js";
import { config } from "../config/index.js";

export interface CleanupResult {
  scannedCandidates: number;
  deletedRooms: number;
  deletedRoomIds: string[];
  skippedActiveRooms: number;
}

export class RoomCleanupService {
  /**
   * Scans for and purges rooms and their canvas data that have been inactive
   * for at least the specified retention period (defaults to config.ROOM_RETENTION_MS, e.g. 24 hours).
   *
   * Rooms with active WebSocket peers in memory or recent in-memory activity are preserved.
   */
  public static async cleanupInactiveRooms(
    retentionMs: number = config.ROOM_RETENTION_MS,
  ): Promise<CleanupResult> {
    const cutoffDate = new Date(Date.now() - retentionMs);
    const roomManager = RoomManager.getInstance();

    const candidates = await RoomRepository.findInactiveRoomCandidates(cutoffDate);
    const roomsToDelete: string[] = [];
    let skippedCount = 0;

    for (const roomId of candidates) {
      const memoryRoom = roomManager.getRoomInMemory(roomId);
      if (memoryRoom) {
        // If room currently has connected peers or had activity within retention window, protect it
        if (!memoryRoom.isEmpty() || Date.now() - memoryRoom.lastActivity < retentionMs) {
          skippedCount++;
          continue;
        }

        // Dormant room in memory; evict it
        roomManager.deleteRoomInMemory(roomId);
      }

      roomsToDelete.push(roomId);
    }

    if (roomsToDelete.length > 0) {
      await RoomRepository.deleteRooms(roomsToDelete);
    }

    return {
      scannedCandidates: candidates.length,
      deletedRooms: roomsToDelete.length,
      deletedRoomIds: roomsToDelete,
      skippedActiveRooms: skippedCount,
    };
  }
}
