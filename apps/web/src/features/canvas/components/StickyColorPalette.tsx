"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { CANVAS_THEME } from "../constants/canvas-theme";
import type { StickyColorPaletteProps as Props } from "../types";

export function StickyColorPalette({
  element,
  transform,
  onColorChange,
}: Props) {
  const currentColor =
    element.colorScheme || element.fill || CANVAS_THEME.stickyNote.defaultColor;

  const screenX = transform.x + (element.x + element.width / 2) * transform.scale;
  let screenY = transform.y + element.y * transform.scale - 46;
  if (screenY < 64) {
    screenY = transform.y + (element.y + element.height) * transform.scale + 12;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden="false"
    >
      <div
        className="pointer-events-auto absolute flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border/70 bg-card/95 p-1.5 shadow-lg backdrop-blur-md"
        style={{
          left: `${screenX}px`,
          top: `${screenY}px`,
        }}
      >
        {CANVAS_THEME.stickyNote.colors.map((c) => {
          const isSelected = currentColor.toLowerCase() === c.value.toLowerCase();
          return (
            <button
              key={c.value}
              type="button"
              title={c.name}
              aria-label={`Change sticky color to ${c.name}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onColorChange(c.value);
              }}
              className={cn(
                "size-5 rounded-full transition-transform hover:scale-115 focus-visible:outline-none",
                isSelected &&
                  "scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background",
              )}
              style={{ backgroundColor: c.value }}
            />
          );
        })}
      </div>
    </div>
  );
}
