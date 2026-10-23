import type { CanvasToolHandler, ToolContext } from "./types";
import type { Point } from "../types";

let panStart: Point | null = null;

export const PanTool: CanvasToolHandler = {
  onPointerDown(_ctx: ToolContext, screenPoint: Point) {
    panStart = screenPoint;
  },

  onPointerMove(ctx: ToolContext, screenPoint: Point) {
    if (!panStart) return;

    const dx = screenPoint.x - panStart.x;
    const dy = screenPoint.y - panStart.y;
    ctx.panBy(dx, dy);
    panStart = screenPoint;
  },

  onPointerUp() {
    panStart = null;
  },
};
