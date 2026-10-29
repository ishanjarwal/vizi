/**
 * Memory-bounded idempotency tracker for operation IDs (opId).
 * Prevents network duplicate replays from re-executing mutations.
 */
export class IdempotencyManager {
  private readonly seenOps = new Map<string, number>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(maxEntries = 10000, ttlMs = 60 * 1000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  /**
   * Checks if an operation has already been processed.
   * If not seen, records it and returns true.
   * If already seen, returns false.
   */
  public register(opId: string): boolean {
    if (!opId || typeof opId !== "string") {
      return false;
    }

    const now = Date.now();
    this.pruneStale(now);

    if (this.seenOps.has(opId)) {
      return false;
    }

    if (this.seenOps.size >= this.maxEntries) {
      // Remove the oldest entry
      const firstKey = this.seenOps.keys().next().value;
      if (firstKey) {
        this.seenOps.delete(firstKey);
      }
    }

    this.seenOps.set(opId, now);
    return true;
  }

  /**
   * Removes entries that have exceeded TTL.
   */
  private pruneStale(now: number): void {
    for (const [key, timestamp] of this.seenOps.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.seenOps.delete(key);
      } else {
        // Map iterates in insertion order; once we find a non-expired entry, earlier ones are done
        break;
      }
    }
  }

  public clear(): void {
    this.seenOps.clear();
  }
}
