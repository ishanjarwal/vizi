import { CanvasElement } from "@vizi/protocol";
import { prisma } from "./client.js";

export interface RoomRecord {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class RoomRepository {
  /**
   * Ensures a room exists in the database. If not found, creates it.
   */
  public static async ensureRoom(roomId: string, name = "Untitled Canvas"): Promise<RoomRecord> {
    return prisma.room.upsert({
      where: { id: roomId },
      update: {
        updatedAt: new Date(),
      },
      create: {
        id: roomId,
        name,
      },
    });
  }

  /**
   * Finds a room by ID.
   */
  public static async findRoom(roomId: string): Promise<RoomRecord | null> {
    return prisma.room.findUnique({
      where: { id: roomId },
    });
  }

  /**
   * Loads all non-deleted elements for a given room.
   */
  public static async loadRoomElements(roomId: string): Promise<CanvasElement[]> {
    const rows = await prisma.canvasElement.findMany({
      where: {
        roomId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return rows.map((row) => {
      let extra: Record<string, unknown> = {};
      try {
        extra = JSON.parse(row.data);
      } catch {
        extra = {};
      }

      return {
        ...extra,
        id: row.id,
        type: row.type as CanvasElement["type"],
        x: row.x,
        y: row.y,
        width: row.width ?? undefined,
        height: row.height ?? undefined,
        rotation: row.rotation ?? undefined,
        stroke: row.stroke,
        strokeWidth: row.strokeWidth,
        fill: row.fill,
        opacity: row.opacity,
        version: row.version,
        updatedAt: row.updatedAt.getTime(),
        createdBy: row.createdBy,
        isDeleted: row.isDeleted,
      } as CanvasElement;
    });
  }

  /**
   * Batch upserts or marks deleted canvas elements in the database.
   */
  public static async persistElements(
    roomId: string,
    elements: CanvasElement[],
  ): Promise<void> {
    if (elements.length === 0) return;

    await this.ensureRoom(roomId);

    await prisma.$transaction(
      elements.map((el) => {
        // Extract extra shape-specific properties for JSON serialization
        const {
          id,
          type,
          x,
          y,
          width,
          height,
          rotation,
          stroke,
          strokeWidth,
          fill,
          opacity,
          version,
          updatedAt,
          createdBy,
          isDeleted,
          ...extra
        } = el;

        const updatedDate = new Date(updatedAt || Date.now());
        const dataJson = JSON.stringify(extra);

        return prisma.canvasElement.upsert({
          where: { id },
          update: {
            type,
            x,
            y,
            width: typeof width === "number" ? width : null,
            height: typeof height === "number" ? height : null,
            rotation: typeof rotation === "number" ? rotation : null,
            stroke: stroke || "#000000",
            strokeWidth: typeof strokeWidth === "number" ? strokeWidth : 1,
            fill: fill || "transparent",
            opacity: typeof opacity === "number" ? opacity : 1,
            data: dataJson,
            version: version || 1,
            isDeleted: Boolean(isDeleted),
            updatedAt: updatedDate,
          },
          create: {
            id,
            roomId,
            type,
            x,
            y,
            width: typeof width === "number" ? width : null,
            height: typeof height === "number" ? height : null,
            rotation: typeof rotation === "number" ? rotation : null,
            stroke: stroke || "#000000",
            strokeWidth: typeof strokeWidth === "number" ? strokeWidth : 1,
            fill: fill || "transparent",
            opacity: typeof opacity === "number" ? opacity : 1,
            data: dataJson,
            version: version || 1,
            isDeleted: Boolean(isDeleted),
            createdBy: createdBy || "anonymous",
            updatedAt: updatedDate,
          },
        });
      }),
    );
  }

  /**
   * Finds candidate room IDs that have not been modified since the cutoff date
   * and do not have any elements updated on or after the cutoff date.
   */
  public static async findInactiveRoomCandidates(cutoffDate: Date): Promise<string[]> {
    const rooms = await prisma.room.findMany({
      where: {
        updatedAt: { lt: cutoffDate },
        createdAt: { lt: cutoffDate },
        elements: {
          none: {
            updatedAt: { gte: cutoffDate },
          },
        },
      },
      select: {
        id: true,
      },
    });

    return rooms.map((r) => r.id);
  }

  /**
   * Permanently deletes rooms and all associated canvas elements by room IDs.
   * Runs in an atomic database transaction.
   */
  public static async deleteRooms(roomIds: string[]): Promise<number> {
    if (roomIds.length === 0) return 0;

    await prisma.$transaction([
      prisma.canvasElement.deleteMany({
        where: { roomId: { in: roomIds } },
      }),
      prisma.room.deleteMany({
        where: { id: { in: roomIds } },
      }),
    ]);

    return roomIds.length;
  }
}
