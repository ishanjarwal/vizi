"use client";

import { Button } from "@/shared/components/shadcn/button";
import { Separator } from "@/shared/components/shadcn/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";
import { cn } from "@/shared/lib/utils";
import { Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { DEFAULT_ZOOM_PERCENT } from "../constants";
import type { BottomLeftOptionsProps as Props } from "../types";

export function BottomLeftOptions({
  className,
  zoom = DEFAULT_ZOOM_PERCENT,
  canUndo = true,
  canRedo = true,
}: Props) {
  return (
    <aside
      aria-label="Canvas zoom and history controls"
      className={cn("fixed bottom-3 left-3 z-40 select-none", className)}
    >
      <TooltipProvider delayDuration={250}>
        <div className="flex items-center gap-1 rounded-2xl border border-border bg-card/95 p-1.5 shadow-md backdrop-blur-md">
          {/* Zoom Out Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Zoom out"
                className="size-8 rounded-lg text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              >
                <Minus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <span>Zoom out</span>
              <span className="text-muted-foreground">(Ctrl+-)</span>
            </TooltipContent>
          </Tooltip>

          {/* Reset Zoom Button / Display */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Reset zoom to 100%"
                className="h-8 min-w-14 px-2 text-xs font-medium text-foreground hover:bg-accent/60"
              >
                {zoom}%
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <span>Reset zoom</span>
              <span className="text-muted-foreground">(Shift+0)</span>
            </TooltipContent>
          </Tooltip>

          {/* Zoom In Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Zoom in"
                className="size-8 rounded-lg text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              >
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <span>Zoom in</span>
              <span className="text-muted-foreground">(Ctrl++)</span>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          {/* Undo Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!canUndo}
                aria-label="Undo last action"
                className="size-8 rounded-lg text-muted-foreground hover:bg-accent/60 hover:text-foreground disabled:opacity-40"
              >
                <Undo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <span>Undo</span>
              <span className="text-muted-foreground">(Ctrl+Z)</span>
            </TooltipContent>
          </Tooltip>

          {/* Redo Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!canRedo}
                aria-label="Redo last action"
                className="size-8 rounded-lg text-muted-foreground hover:bg-accent/60 hover:text-foreground disabled:opacity-40"
              >
                <Redo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <span>Redo</span>
              <span className="text-muted-foreground">(Ctrl+Y)</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </aside>
  );
}
