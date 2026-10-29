import { inngest } from "./inngest.js";
import { RoomCleanupService } from "../room/cleanupService.js";
import { config } from "../config/index.js";

/**
 * Scheduled Inngest function that triggers periodically to auto-delete
 * orphaned and inactive rooms (along with all associated canvas data)
 * that haven't been used for at least one day.
 */
export const cleanupOrphanedRoomsFunction = inngest.createFunction(
  {
    id: "cleanup-orphaned-rooms",
    name: "Cleanup Orphaned and Inactive Rooms",
    triggers: [
      { cron: config.ROOM_CLEANUP_CRON },
      { event: "vizi/rooms.cleanup" },
    ],
  },
  async ({ step }) => {
    const result = await step.run("purge-inactive-rooms", async () => {
      return await RoomCleanupService.cleanupInactiveRooms(config.ROOM_RETENTION_MS);
    });

    return {
      success: true,
      scannedCandidates: result.scannedCandidates,
      deletedRooms: result.deletedRooms,
      deletedRoomIds: result.deletedRoomIds,
      skippedActiveRooms: result.skippedActiveRooms,
    };
  },
);
