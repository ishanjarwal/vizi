"use client";

import * as React from "react";
import type { UserCursorsOverlayProps as Props } from "../types";
import { UserCursor } from "./UserCursor";

export function UserCursorsOverlay({ peers, transform, currentUserId }: Props) {
  const remotePeers = React.useMemo(() => {
    return peers.filter((p) => p.id !== currentUserId && p.cursor !== undefined);
  }, [peers, currentUserId]);

  if (remotePeers.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {remotePeers.map((peer) => (
        <UserCursor key={peer.id} peer={peer} transform={transform} />
      ))}
    </div>
  );
}

export default UserCursorsOverlay;
