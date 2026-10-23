"use client";

import * as React from "react";
import { Share2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ThemeToggleButton } from "@/shared/components/ThemeToggleButton";
import { Button } from "@/shared/components/shadcn/button";
import type { TopRightMenuProps as Props } from "../types";

export function TopRightMenu({ className, children }: Props) {
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
        className="h-10 gap-2 rounded-xl border-border bg-card/95 px-3 py-1.5 shadow-md backdrop-blur-md transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Share2 className="size-4 text-primary" />
        <span className="text-xs font-semibold">Collaborate</span>
      </Button>

      <ThemeToggleButton />

      {children}
    </div>
  );
}

export default TopRightMenu;
