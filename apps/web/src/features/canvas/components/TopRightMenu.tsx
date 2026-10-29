"use client";

import * as React from "react";
import { Share2, Users } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ThemeToggleButton } from "@/shared/components/ThemeToggleButton";
import { Button } from "@/shared/components/shadcn/button";
import type { TopRightMenuProps as Props } from "../types";

export function TopRightMenu({
  className,
  children,
  onCollaborate,
  peerCount = 0,
  isConnected = false,
  roomId,
}: Props) {
  return (
    <div
      className={cn(
        "fixed top-3 right-3 z-40 flex items-center gap-2 select-none",
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Share room"
        onClick={onCollaborate}
        className={cn(
          "h-10 gap-2 rounded-xl border-border bg-card/95 px-3 py-1.5 shadow-md backdrop-blur-md transition-colors hover:bg-accent hover:text-accent-foreground",
          isConnected && "border-emerald-500/40",
        )}
      >
        <Share2 className="size-4 text-primary" />
        <span className="text-xs font-semibold">
          {roomId ? "Room Active" : "Collaborate"}
        </span>

        {roomId && isConnected ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Users className="size-3" />
            <span>{peerCount + 1}</span>
          </span>
        ) : null}
      </Button>

      <ThemeToggleButton />

      {children}
    </div>
  );
}

export default TopRightMenu;
