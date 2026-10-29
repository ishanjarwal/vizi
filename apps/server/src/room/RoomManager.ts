import { Room } from "./Room.js";
import { RoomRepository } from "../db/repository.js";
import { config } from "../config/index.js";

export class RoomManager {
  private static instance: RoomManager | null = null;
  private readonly rooms = new Map<string, Room>();
  private flushTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startBackgroundTasks();
  }

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  /**
   * Retrieves an existing room from memory or hydrates it from the database.
   */
  public async getOrCreateRoom(roomId: string): Promise<Room> {
    const existing = this.rooms.get(roomId);
    if (existing) {
      return existing;
    }

    // Hydrate from DB
    await RoomRepository.ensureRoom(roomId);
    const elements = await RoomRepository.loadRoomElements(roomId);
    const roomRecord = await RoomRepository.findRoom(roomId);

    const room = new Room(roomId, roomRecord?.name || "Untitled Canvas", elements);
    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Retrieves a room if it is currently in memory.
   */
  public getRoomInMemory(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Deletes a room from memory if it is currently empty.
   * Returns true if removed or not in memory, false if the room currently has active peers.
   */
  public deleteRoomInMemory(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return true;
    }
    if (!room.isEmpty()) {
      return false;
    }
    this.rooms.delete(roomId);
    return true;
  }

  public getActiveRoomCount(): number {
    return this.rooms.size;
  }

  public getTotalConnectedClients(): number {
    let count = 0;
    for (const room of this.rooms.values()) {
      count += room.getPeerCount();
    }
    return count;
  }

  /**
   * Periodically flushes in-memory dirty changes to the database.
   */
  private startBackgroundTasks(): void {
    this.flushTimer = setInterval(() => {
      void this.flushAllRooms();
    }, config.DB_FLUSH_INTERVAL_MS);

    // Evict idle rooms every 2 minutes
    this.cleanupTimer = setInterval(() => {
      this.evictIdleRooms();
    }, 2 * 60 * 1000);
  }

  /**
   * Flushes all active rooms to DB.
   */
  public async flushAllRooms(): Promise<void> {
    const flushPromises: Promise<void>[] = [];
    for (const room of this.rooms.values()) {
      flushPromises.push(room.flushDirtyToDb());
    }
    await Promise.allSettled(flushPromises);
  }

  /**
   * Evicts empty rooms that have exceeded idle timeout.
   */
  private evictIdleRooms(): void {
    const now = Date.now();
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.isEmpty() && now - room.lastActivity > config.ROOM_IDLE_TIMEOUT_MS) {
        void room.flushDirtyToDb().then(() => {
          // Verify it's still empty before evicting
          if (room.isEmpty()) {
            this.rooms.delete(roomId);
          }
        });
      }
    }
  }

  /**
   * Stops timers and flushes all pending updates to database.
   */
  public async shutdown(): Promise<void> {
    if (this.flushTimer) clearInterval(this.flushTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    await this.flushAllRooms();
  }
}
