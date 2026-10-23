"use client";

import * as React from "react";
import { Rect } from "react-konva";
import { CANVAS_THEME } from "../constants/canvas-theme";
import type { SelectionMarqueeProps as Props } from "../types";

export function SelectionMarquee({ marqueeBox }: Props) {
  if (!marqueeBox || (marqueeBox.width === 0 && marqueeBox.height === 0)) {
    return null;
  }

  return (
    <Rect
      x={marqueeBox.x}
      y={marqueeBox.y}
      width={marqueeBox.width}
      height={marqueeBox.height}
      stroke={CANVAS_THEME.marquee.stroke}
      strokeWidth={CANVAS_THEME.marquee.strokeWidth}
      fill={CANVAS_THEME.marquee.fill}
      dash={CANVAS_THEME.marquee.dash as unknown as number[]}
      listening={false}
    />
  );
}
