import { CanvasElement } from "@vizi/protocol";

export interface ResolutionResult {
  accepted: boolean;
  winner: CanvasElement;
  isConflict: boolean;
}

/**
 * Deterministic Element-Level Last-Write-Wins (LWW) resolver with monotonic versioning.
 *
 * Rules:
 * 1. If element does not exist, incoming is accepted.
 * 2. If current element is tombstoned (isDeleted: true), an incoming non-deleted element
 *    can only resurrect it if incoming.version > current.version.
 * 3. Incoming wins if incoming.version > current.version.
 * 4. If incoming.version === current.version, incoming wins if incoming.updatedAt > current.updatedAt.
 * 5. Otherwise current wins, and a conflict is flagged so client state can be reconciled.
 */
export class ConflictResolver {
  public static resolveUpdate(
    current: CanvasElement | undefined,
    incoming: CanvasElement,
  ): ResolutionResult {
    if (!current) {
      return {
        accepted: true,
        winner: incoming,
        isConflict: false,
      };
    }

    // Guard against resurrection of tombstoned elements by stale frames
    if (current.isDeleted && !incoming.isDeleted) {
      if (incoming.version <= current.version) {
        return {
          accepted: false,
          winner: current,
          isConflict: true,
        };
      }
    }

    const incomingVersion = incoming.version ?? 1;
    const currentVersion = current.version ?? 1;

    if (incomingVersion > currentVersion) {
      return {
        accepted: true,
        winner: incoming,
        isConflict: false,
      };
    }

    if (incomingVersion === currentVersion) {
      const incomingTime = incoming.updatedAt ?? 0;
      const currentTime = current.updatedAt ?? 0;

      if (incomingTime > currentTime) {
        return {
          accepted: true,
          winner: incoming,
          isConflict: false,
        };
      }
    }

    // Stale update rejected
    return {
      accepted: false,
      winner: current,
      isConflict: true,
    };
  }
}
