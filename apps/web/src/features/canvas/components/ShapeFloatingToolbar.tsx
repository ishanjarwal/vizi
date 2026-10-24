"use client";

import * as React from "react";
import { Copy, PaintBucket, PenLine, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { getCanvasTheme } from "../constants/canvas-theme";
import type { ShapeFloatingToolbarProps as Props } from "../types";
import { getElementBoundingBox } from "../utils/helper";

export function ShapeFloatingToolbar({
  element,
  transform,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  theme = "light",
}: Props) {
  const themeConfig = getCanvasTheme(theme);

  const hasFill =
    element.type === "rectangle" ||
    element.type === "ellipse" ||
    element.type === "diamond";

  const hasStroke =
    element.type === "rectangle" ||
    element.type === "ellipse" ||
    element.type === "diamond" ||
    element.type === "line" ||
    element.type === "arrow" ||
    element.type === "pen";

  const hasStrokeWidth = hasStroke;
  const isSticky = element.type === "sticky";
  const isText = element.type === "text";

  const currentFill =
    "fill" in element ? (element.fill as string) : "transparent";
  const currentStroke =
    "stroke" in element ? (element.stroke as string) : "#1e293b";
  const currentStrokeWidth =
    "strokeWidth" in element ? (element.strokeWidth as number) : 2;
  const currentFontSize =
    element.type === "text" ? element.fontSize ?? 24 : 24;

  const box = getElementBoundingBox(element);
  let rawScreenX = transform.x + (box.x + box.width / 2) * transform.scale;
  if (typeof window !== "undefined") {
    rawScreenX = Math.max(135, Math.min(window.innerWidth - 135, rawScreenX));
  }

  // Calculate panel height for accurate positioning
  const panelHeight = hasFill
    ? 156
    : hasStrokeWidth || isText
      ? 116
      : 80;

  let screenY = transform.y + box.y * transform.scale - panelHeight - 12;
  if (screenY < 64) {
    screenY = transform.y + (box.y + box.height) * transform.scale + 14;
  }
  if (typeof window !== "undefined") {
    screenY = Math.max(70, Math.min(window.innerHeight - panelHeight - 20, screenY));
  }

  const handleFillSelect = (fillColor: string) => {
    if ("fill" in element) {
      onUpdateElement({ ...element, fill: fillColor });
    }
  };

  const handleStrokeSelect = (strokeColor: string) => {
    if ("stroke" in element) {
      onUpdateElement({ ...element, stroke: strokeColor });
    }
  };

  const handleStickyColorSelect = (colorValue: string) => {
    if (element.type === "sticky") {
      onUpdateElement({ ...element, colorScheme: colorValue, fill: colorValue });
    }
  };

  const handleStrokeWidthSelect = (width: number) => {
    if ("strokeWidth" in element) {
      onUpdateElement({ ...element, strokeWidth: width });
    }
  };

  const handleFontSizeSelect = (size: number) => {
    if (element.type === "text") {
      onUpdateElement({ ...element, fontSize: size });
    }
  };

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden="false"
    >
      <div
        className="pointer-events-auto absolute flex w-[260px] -translate-x-1/2 flex-col gap-2 rounded-2xl border border-border/80 bg-card/95 p-2.5 shadow-xl backdrop-blur-md"
        style={{
          left: `${rawScreenX}px`,
          top: `${screenY}px`,
        }}
      >
        {/* ROW 1 (for closed shapes): Background / Fill Color Palette */}
        {hasFill ? (
          <div className="flex items-center justify-between gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <PaintBucket className="size-3" /> Fill
            </span>
            <div className="flex items-center gap-1">
              {themeConfig.palette.fills.map((f) => {
                const isSelected =
                  currentFill.toLowerCase() === f.value.toLowerCase();
                return (
                  <button
                    key={f.value}
                    type="button"
                    title={`Fill ${f.name}`}
                    aria-label={`Fill ${f.name}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleFillSelect(f.value);
                    }}
                    className={cn(
                      "relative size-5 rounded-full transition-transform hover:scale-115 focus-visible:outline-none",
                      isSelected &&
                        "scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background",
                      f.value === "transparent" &&
                        "border border-border/80 bg-background",
                    )}
                    style={{
                      backgroundColor:
                        f.value === "transparent" ? undefined : f.value,
                    }}
                  >
                    {f.value === "transparent" ? (
                      <div className="absolute inset-0 m-auto h-[1.5px] w-full rotate-45 bg-red-500" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* ROW (for closed shapes, line, arrow, pen): Stroke Color Palette */}
        {hasStroke ? (
          <div className="flex items-center justify-between gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <PenLine className="size-3" /> Stroke
            </span>
            <div className="flex items-center gap-1">
              {themeConfig.palette.strokes.map((s) => {
                const isSelected =
                  currentStroke.toLowerCase() === s.value.toLowerCase();
                return (
                  <button
                    key={s.value}
                    type="button"
                    title={`Stroke ${s.name}`}
                    aria-label={`Stroke ${s.name}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleStrokeSelect(s.value);
                    }}
                    className={cn(
                      "size-5 rounded-full transition-transform hover:scale-115 focus-visible:outline-none",
                      isSelected &&
                        "scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background",
                    )}
                    style={{ backgroundColor: s.value }}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {/* ROW (for sticky notes): Pastel Note Color Palette */}
        {isSticky ? (
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Note Color
            </span>
            <div className="flex items-center gap-1.5">
              {themeConfig.stickyNote.colors.map((c) => {
                const currentColor =
                  element.colorScheme ||
                  element.fill ||
                  themeConfig.stickyNote.defaultColor;
                const isSelected =
                  currentColor.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    aria-label={`Color ${c.name}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleStickyColorSelect(c.value);
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
        ) : null}

        {/* ROW (for text): Text Color Palette */}
        {isText ? (
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Color
            </span>
            <div className="flex items-center gap-1">
              {themeConfig.palette.strokes.map((s) => {
                const isSelected =
                  currentStroke.toLowerCase() === s.value.toLowerCase();
                return (
                  <button
                    key={s.value}
                    type="button"
                    title={`Text color ${s.name}`}
                    aria-label={`Text color ${s.name}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleStrokeSelect(s.value);
                    }}
                    className={cn(
                      "size-5 rounded-full transition-transform hover:scale-115 focus-visible:outline-none",
                      isSelected &&
                        "scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background",
                    )}
                    style={{ backgroundColor: s.value }}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {/* NEXT ROW: Stroke Width (occupying the whole width with 3 buttons) */}
        {hasStrokeWidth ? (
          <div className="grid w-full grid-cols-3 gap-1 rounded-lg bg-muted/60 p-0.5">
            {themeConfig.palette.strokeWidths.map((sw) => {
              const isSelected = currentStrokeWidth === sw.value;
              return (
                <button
                  key={sw.value}
                  type="button"
                  title={`Stroke width ${sw.label} (${sw.value}px)`}
                  aria-label={`Stroke width ${sw.label}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleStrokeWidthSelect(sw.value);
                  }}
                  className={cn(
                    "flex h-7 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-all hover:text-foreground focus-visible:outline-none",
                    isSelected &&
                      "bg-background text-foreground shadow-xs font-semibold",
                  )}
                >
                  <div
                    className="w-4 rounded-full bg-current"
                    style={{
                      height: `${sw.value === 1 ? 1.5 : sw.value === 2 ? 2.5 : 4}px`,
                    }}
                  />
                  <span>{sw.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {/* ROW (for text): Font Size (occupying the whole width with 4 buttons) */}
        {isText ? (
          <div className="grid w-full grid-cols-4 gap-1 rounded-lg bg-muted/60 p-0.5">
            {themeConfig.palette.fontSizes.map((fs) => {
              const isSelected = currentFontSize === fs.value;
              return (
                <button
                  key={fs.value}
                  type="button"
                  title={`Font size ${fs.label} (${fs.value}px)`}
                  aria-label={`Font size ${fs.label}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleFontSizeSelect(fs.value);
                  }}
                  className={cn(
                    "flex h-7 items-center justify-center rounded-md text-xs font-semibold text-muted-foreground transition-all hover:text-foreground focus-visible:outline-none",
                    isSelected &&
                      "bg-background text-primary shadow-xs font-bold",
                  )}
                >
                  {fs.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* FINAL ROW: Duplicate and Delete Actions */}
        <div className="flex w-full items-center gap-1.5 border-t border-border/50 pt-2">
          <button
            type="button"
            title="Duplicate element"
            aria-label="Duplicate element"
            onMouseDown={(e) => {
              e.preventDefault();
              onDuplicateElement(element);
            }}
            className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background/50 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none"
          >
            <Copy className="size-3.5" />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            title="Delete element"
            aria-label="Delete element"
            onMouseDown={(e) => {
              e.preventDefault();
              onDeleteElement(element.id);
            }}
            className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/15 focus-visible:outline-none"
          >
            <Trash2 className="size-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
