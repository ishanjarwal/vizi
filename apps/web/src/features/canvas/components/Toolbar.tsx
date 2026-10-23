"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/shadcn/button";
import { Separator } from "@/shared/components/shadcn/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";
import { DEFAULT_ACTIVE_TOOL, TOOL_ITEMS } from "../constants";
import type { ToolbarProps as Props, ToolItem } from "../types";

export function Toolbar({
  className,
  activeToolId = DEFAULT_ACTIVE_TOOL,
}: Props) {
  const navigationTools = TOOL_ITEMS.filter(
    (tool: ToolItem) => tool.group === "navigation",
  );
  const shapeTools = TOOL_ITEMS.filter(
    (tool: ToolItem) => tool.group === "shapes",
  );
  const creationTools = TOOL_ITEMS.filter(
    (tool: ToolItem) => tool.group === "creation",
  );

  return (
    <header
      className={cn(
        "fixed top-3 left-1/2 z-40 -translate-x-1/2 select-none",
        className,
      )}
    >
      <TooltipProvider delayDuration={250}>
        <nav
          aria-label="Canvas drawing tools"
          className="flex items-center gap-1 rounded-2xl border border-border bg-card/95 p-1.5 shadow-md backdrop-blur-md"
        >
          {navigationTools.map((tool: ToolItem) => {
            const Icon = tool.icon;
            const isActive = tool.id === activeToolId;

            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${tool.label} (${tool.shortcut})`}
                    className={cn(
                      "relative size-9 rounded-lg transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4.5" />
                    <span className="pointer-events-none absolute right-1 bottom-0.5 text-[9px] font-medium leading-none text-muted-foreground/80">
                      {tool.shortcut}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  <span>{tool.label}</span>
                  <span className="text-muted-foreground">
                    ({tool.shortcut})
                  </span>
                </TooltipContent>
              </Tooltip>
            );
          })}

          <Separator orientation="vertical" className="mx-0.5 h-5 w-px" />

          {shapeTools.map((tool: ToolItem) => {
            const Icon = tool.icon;
            const isActive = tool.id === activeToolId;

            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${tool.label} (${tool.shortcut})`}
                    className={cn(
                      "relative size-9 rounded-lg transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4.5" />
                    <span className="pointer-events-none absolute right-1 bottom-0.5 text-[9px] font-medium leading-none text-muted-foreground/80">
                      {tool.shortcut}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  <span>{tool.label}</span>
                  <span className="text-muted-foreground">
                    ({tool.shortcut})
                  </span>
                </TooltipContent>
              </Tooltip>
            );
          })}

          <Separator orientation="vertical" className="mx-0.5 h-5 w-px" />

          {creationTools.map((tool: ToolItem) => {
            const Icon = tool.icon;
            const isActive = tool.id === activeToolId;

            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${tool.label} (${tool.shortcut})`}
                    className={cn(
                      "relative size-9 rounded-lg transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4.5" />
                    <span className="pointer-events-none absolute right-1 bottom-0.5 text-[9px] font-medium leading-none text-muted-foreground/80">
                      {tool.shortcut}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  <span>{tool.label}</span>
                  <span className="text-muted-foreground">
                    ({tool.shortcut})
                  </span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>
    </header>
  );
}
