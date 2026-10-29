"use client";

import * as React from "react";
import {
  Check,
  Grid,
  ImageDown,
  PaintBucket,
  Palette,
  PenLine,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { CANVAS_BG_PRESETS, getCanvasTheme } from "../constants/canvas-theme";
import type { CanvasOptionsPanelProps as Props } from "../types";
import { Separator } from "@/shared/components/shadcn/separator";
import { Switch } from "@/shared/components/shadcn/switch";
import { Button } from "@/shared/components/shadcn/button";

export function CanvasOptionsPanel({
  className,
  theme = "light",
  styles,
  onChangeStyles,
  isDotted = true,
  onToggleDotted,
  canvasBgId = "default",
  onChangeCanvasBg,
  includeBgOnExport = true,
  onToggleIncludeBgOnExport,
}: Props) {
  const themeConfig = getCanvasTheme(theme);

  const handleStrokeSelect = (strokeColor: string) => {
    onChangeStyles({
      ...styles,
      stroke: strokeColor,
    });
  };

  const handleFillSelect = (fillColor: string) => {
    onChangeStyles({
      ...styles,
      fill: fillColor,
    });
  };

  const handleStrokeWidthSelect = (width: number) => {
    onChangeStyles({
      ...styles,
      strokeWidth: width,
    });
  };

  return (
    <aside
      aria-label="Canvas style presets"
      className={cn(
        "fixed left-3 top-1/2 z-30 -translate-y-1/2 select-none",
        className,
      )}
    >
      <div className="flex w-[200px] max-h-[calc(100vh-120px)] overflow-y-auto flex-col gap-3 rounded-2xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur-md">
        <div className="mb-1 gap-1 flex flex-col">
          <p className="text-sm text-muted-foreground font-medium">Options</p>
          <Separator orientation="horizontal" className="w-full h-px" />
        </div>

        {/* Stroke Color Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <PenLine className="size-3" />
            <span>Stroke</span>
          </div>
          <div className="flex items-center gap-1.5">
            {themeConfig.palette.strokes.map((s) => {
              const isSelected =
                styles.stroke.toLowerCase() === s.value.toLowerCase();
              return (
                <button
                  key={s.value}
                  type="button"
                  title={`Stroke ${s.name}`}
                  aria-label={`Stroke ${s.name}`}
                  onClick={() => handleStrokeSelect(s.value)}
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

        {/* Fill Color Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <PaintBucket className="size-3" />
            <span>Fill</span>
          </div>
          <div className="flex items-center gap-1.5">
            {themeConfig.palette.fills.map((f) => {
              const isSelected =
                styles.fill.toLowerCase() === f.value.toLowerCase();
              return (
                <button
                  key={f.value}
                  type="button"
                  title={`Fill ${f.name}`}
                  aria-label={`Fill ${f.name}`}
                  onClick={() => handleFillSelect(f.value)}
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

        {/* Stroke Width Section */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            Stroke Width
          </span>
          <div className="grid w-full grid-cols-3 gap-1 rounded-lg bg-muted/60 p-0.5">
            {themeConfig.palette.strokeWidths.map((sw) => {
              const isSelected = styles.strokeWidth === sw.value;
              return (
                <button
                  key={sw.value}
                  type="button"
                  title={`Stroke width ${sw.label} (${sw.value}px)`}
                  aria-label={`Stroke width ${sw.label}`}
                  onClick={() => handleStrokeWidthSelect(sw.value)}
                  className={cn(
                    "flex h-7 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-all hover:text-foreground focus-visible:outline-none",
                    isSelected &&
                      "bg-background text-foreground shadow-xs font-semibold",
                  )}
                >
                  <div
                    className="w-3 rounded-full bg-current"
                    style={{
                      height: `${sw.value === 1 ? 1.5 : sw.value === 2 ? 2.5 : 4}px`,
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <Separator orientation="horizontal" className="w-full h-px my-0.5" />

        {/* Canvas Background Color Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Palette className="size-3" />
            <span>Canvas BG</span>
          </div>
          <div className="flex items-center gap-1.5">
            {CANVAS_BG_PRESETS.map((preset) => {
              const color = theme === "dark" ? preset.dark : preset.light;
              const isSelected = canvasBgId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  title={`Canvas ${preset.name}`}
                  aria-label={`Canvas background ${preset.name}`}
                  onClick={() => onChangeCanvasBg?.(preset.id)}
                  className={cn(
                    "size-5 rounded-full border border-border/60 transition-transform hover:scale-115 focus-visible:outline-none",
                    isSelected &&
                      "scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background",
                  )}
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>
        </div>

        {/* Dotted Grid and Toggle BG on export buttons */}
        <div className="flex flex-col gap-3">
          {/* Dotted Grid Toggle */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="dotted-grid"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <Grid className="size-4" />
              Dotted Grid
            </label>
            <Switch
              id="dotted-grid"
              checked={isDotted}
              onCheckedChange={onToggleDotted}
              className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
          </div>

          {/* Export with Background Toggle */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="export-background"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <ImageDown className="size-4" />
              Export with BG
            </label>
            <Switch
              id="export-background"
              checked={includeBgOnExport}
              onCheckedChange={onToggleIncludeBgOnExport}
              className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
