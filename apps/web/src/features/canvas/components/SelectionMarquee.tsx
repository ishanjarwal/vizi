"use client";

import * as React from "react";
import { Rect } from "react-konva";
import { getCanvasTheme } from "../constants/canvas-theme";
import type { SelectionMarqueeProps as Props } from "../types";

export function SelectionMarquee({ marqueeBox, theme = "light" }: Props) {
  if (!marqueeBox || (marqueeBox.width === 0 && marqueeBox.height === 0)) {
    return null;
  }

  const themeConfig = getCanvasTheme(theme);

  return (
    <Rect
      x={marqueeBox.x}
      y={marqueeBox.y}
      width={marqueeBox.width}
      height={marqueeBox.height}
      stroke={themeConfig.marquee.stroke}
      strokeWidth={themeConfig.marquee.strokeWidth}
      fill={themeConfig.marquee.fill}
      dash={themeConfig.marquee.dash as unknown as number[]}
      listening={false}
    />
  );
}
