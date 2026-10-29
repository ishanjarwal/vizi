import {
  BaseWSMessage,
  CanvasElement,
  Peer,
  serializeWSMessage,
  UserInfo,
  WSEventType,
} from "@vizi/protocol";
import { AuthenticatedClient } from "../websocket/types.js";
import { IdempotencyManager } from "../sync/idempotency.js";
import { ConflictResolver } from "../sync/conflictResolver.js";
import { RoomRepository } from "../db/repository.js";

export interface ConnectedPeerSession {
  peer: Peer;
  ws: AuthenticatedClient;
}

export class Room {
  public readonly id: string;
  public name: string;
  private readonly peers = new Map<string, ConnectedPeerSession>();
  private readonly elements = new Map<string, CanvasElement>();
  private readonly idempotency = new IdempotencyManager();
  private readonly dirtyElementIds = new Set<string>();
  private lastActivityTime = Date.now();
  private isFlushing = false;

  constructor(id: string, name = "Untitled Canvas", initialElements: CanvasElement[] = []) {
    this.id = id;
    this.name = name;
    for (const el of initialElements) {
      this.elements.set(el.id, el);
    }
  }

  public get lastActivity(): number {
    return this.lastActivityTime;
  }

  public touch(): void {
    this.lastActivityTime = Date.now();
  }

  public isEmpty(): boolean {
    return this.peers.size === 0;
  }

  public getPeerCount(): number {
    return this.peers.size;
  }

  public getPeers(): Peer[] {
    return Array.from(this.peers.values()).map((p) => p.peer);
  }

  public getPeer(peerId: string): ConnectedPeerSession | undefined {
    return this.peers.get(peerId);
  }

  public addPeer(user: UserInfo, ws: AuthenticatedClient): Peer {
    this.touch();
    const peer: Peer = {
      ...user,
      cursor: undefined,
    };

    this.peers.set(user.id, { peer, ws });
    return peer;
  }

  public removePeer(peerId: string): Peer | null {
    this.touch();
    const session = this.peers.get(peerId);
    if (!session) return null;

    this.peers.delete(peerId);
    return session.peer;
  }

  public updateCursor(
    peerId: string,
    x: number,
    y: number,
    isDrawing?: boolean,
  ): Peer | null {
    this.touch();
    const session = this.peers.get(peerId);
    if (!session) return null;

    session.peer.cursor = {
      x,
      y,
      isDrawing,
      lastActive: Date.now(),
    };

    return session.peer;
  }

  public getSnapshot(): CanvasElement[] {
    return Array.from(this.elements.values()).filter((el) => !el.isDeleted);
  }

  public getAllElements(): CanvasElement[] {
    return Array.from(this.elements.values());
  }

  /**
   * Applies newly created elements with idempotency check.
   */
  public applyElementCreates(
    elements: CanvasElement[],
    opId: string,
    senderId: string,
  ): { applied: CanvasElement[]; isDuplicate: boolean } {
    this.touch();
    if (!this.idempotency.register(opId)) {
      return { applied: [], isDuplicate: true };
    }

    const applied: CanvasElement[] = [];

    for (const el of elements) {
      const existing = this.elements.get(el.id);
      // For create, if not exists or if incoming version is higher, accept
      const resolved = ConflictResolver.resolveUpdate(existing, el);
      if (resolved.accepted) {
        const toStore: CanvasElement = {
          ...el,
          createdBy: el.createdBy || senderId,
          version: Math.max(1, el.version || 1),
          updatedAt: el.updatedAt || Date.now(),
          isDeleted: false,
        };
        this.elements.set(el.id, toStore);
        this.dirtyElementIds.add(el.id);
        applied.push(toStore);
      }
    }

    return { applied, isDuplicate: false };
  }

  /**
   * Applies element updates with Element-Level Last-Write-Wins (LWW) resolution.
   */
  public applyElementUpdates(
    elements: CanvasElement[],
    opId: string,
  ): { applied: CanvasElement[]; conflicts: CanvasElement[]; isDuplicate: boolean } {
    this.touch();
    if (!this.idempotency.register(opId)) {
      return { applied: [], conflicts: [], isDuplicate: true };
    }

    const applied: CanvasElement[] = [];
    const conflicts: CanvasElement[] = [];

    for (const incoming of elements) {
      const current = this.elements.get(incoming.id);
      const resolution = ConflictResolver.resolveUpdate(current, incoming);

      if (resolution.accepted) {
        this.elements.set(incoming.id, resolution.winner);
        this.dirtyElementIds.add(incoming.id);
        applied.push(resolution.winner);
      } else {
        conflicts.push(resolution.winner);
      }
    }

    return { applied, conflicts, isDuplicate: false };
  }

  /**
   * Applies element soft deletions (tombstones).
   */
  public applyElementDeletes(
    elementIds: string[],
    opId: string,
    senderId: string,
  ): { deleted: string[]; isDuplicate: boolean } {
    this.touch();
    if (!this.idempotency.register(opId)) {
      return { deleted: [], isDuplicate: true };
    }

    const deleted: string[] = [];

    for (const id of elementIds) {
      const current = this.elements.get(id);
      if (current) {
        const tombstone: CanvasElement = {
          ...current,
          version: (current.version || 1) + 1,
          updatedAt: Date.now(),
          createdBy: senderId,
          isDeleted: true,
        };
        this.elements.set(id, tombstone);
        this.dirtyElementIds.add(id);
        deleted.push(id);
      }
    }

    return { deleted, isDuplicate: false };
  }

  /**
   * Broadcasts a JSON WebSocket message to peers in the room.
   */
  public broadcast<T extends WSEventType, P>(
    message: BaseWSMessage<T, P>,
    excludePeerId?: string,
  ): void {
    const raw = serializeWSMessage(message);

    for (const [peerId, session] of this.peers.entries()) {
      if (excludePeerId && peerId === excludePeerId) {
        continue;
      }
      if (session.ws.readyState === session.ws.OPEN) {
        try {
          session.ws.send(raw);
        } catch (err) {
          console.error(`Failed to broadcast message to peer ${peerId}:`, err);
        }
      }
    }
  }

  /**
   * Flushes dirty elements to the database via Prisma.
   */
  public async flushDirtyToDb(): Promise<void> {
    if (this.dirtyElementIds.size === 0 || this.isFlushing) {
      return;
    }

    this.isFlushing = true;
    const idsToFlush = Array.from(this.dirtyElementIds);
    // Remove from dirty set now; any new mutations will re-add
    for (const id of idsToFlush) {
      this.dirtyElementIds.delete(id);
    }

    const elementsToPersist: CanvasElement[] = [];
    for (const id of idsToFlush) {
      const el = this.elements.get(id);
      if (el) {
        elementsToPersist.push(el);
      }
    }

    try {
      if (elementsToPersist.length > 0) {
        await RoomRepository.persistElements(this.id, elementsToPersist);
      }
    } catch (err) {
      console.error(`Error persisting elements for room ${this.id}:`, err);
      // Re-queue failed IDs
      for (const id of idsToFlush) {
        this.dirtyElementIds.add(id);
      }
    } finally {
      this.isFlushing = false;
    }
  }
}
