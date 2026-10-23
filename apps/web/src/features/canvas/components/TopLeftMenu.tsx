"use client";

import { Button } from "@/shared/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/shared/components/shadcn/dropdown-menu";
import { BRAND_LOGO, BRAND_NAME } from "@/shared/constants";
import { cn } from "@/shared/lib/utils";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { TOP_MENU_ITEMS } from "../constants";
import type { MenuItem, TopMenuProps as Props } from "../types";
import { Kbd, KbdGroup } from "@/shared/components/shadcn/kbd";

export function TopLeftMenu({ className }: Props) {
  return (
    <div className={cn("fixed top-3 left-3 z-40 select-none", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Open Vizi main menu"
            className="h-10 gap-2 rounded-xl border-border bg-card/95 px-2.5 py-1.5 shadow-md backdrop-blur-md transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Image
              alt={BRAND_NAME}
              src={BRAND_LOGO}
              height={128}
              width={128}
              className="size-10 shrink-0"
            />
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-78 rounded-xl border-border bg-popover/98 p-1.5 shadow-lg backdrop-blur-md"
        >
          {TOP_MENU_ITEMS.map((item: MenuItem) => {
            const Icon = item.icon;
            const kbd_items = item.shortcut?.split(" ");
            return (
              <React.Fragment key={item.id}>
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer gap-2 rounded-lg px-2.5 py-2 font-medium",
                    item.isDestructive
                      ? "text-destructive focus:bg-destructive/15 focus:text-destructive"
                      : "text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                  {kbd_items ? (
                    <DropdownMenuShortcut>
                      <KbdGroup className="gap-[2px]">
                        {kbd_items.map((it) => {
                          return it === "+" ? (
                            <span key={item.id + it} className="text-[8px]">
                              +
                            </span>
                          ) : (
                            <Kbd
                              key={item.id + it}
                              className="font-mono text-[8px] tracking-tight"
                            >
                              {it}
                            </Kbd>
                          );
                        })}
                      </KbdGroup>
                    </DropdownMenuShortcut>
                  ) : null}
                </DropdownMenuItem>
                {item.hasSeparatorBelow ? (
                  <DropdownMenuSeparator className="my-1 bg-border" />
                ) : null}
              </React.Fragment>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
