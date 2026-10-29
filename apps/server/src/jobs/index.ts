import { cleanupOrphanedRoomsFunction } from "./cleanupRooms.js";

export * from "./inngest.js";
export * from "./cleanupRooms.js";

/**
 * Registry of all Inngest functions served by the Vizi backend.
 */
export const inngestFunctions = [cleanupOrphanedRoomsFunction];
