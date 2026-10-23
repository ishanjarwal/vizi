import {
  getElementBoundingBox,
  isEnclosed,
  normalizeBoundingBox,
} from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { Point } from "../types";

let marqueeStart: Point | null = null;
let isMarqueeDragging = false;

export const SelectionTool: CanvasToolHandler = {
  onPointerDown(
    ctx: ToolContext,
    _screenPoint: Point,
    canvasPoint: Point,
    e: MouseEvent | TouchEvent,
  ) {
    const shiftKey = (e as MouseEvent).shiftKey ?? false;
    marqueeStart = canvasPoint;
    isMarqueeDragging = true;
    if (!shiftKey) {
      ctx.setSelectedIds([]);
    }
  },

  onPointerMove(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    if (!isMarqueeDragging || !marqueeStart) return;

    const box = normalizeBoundingBox(marqueeStart, canvasPoint);
    if (box.width > 3 || box.height > 3) {
      ctx.setMarqueeBox(box);
    }
  },

  onPointerUp(
    ctx: ToolContext,
    _screenPoint: Point,
    canvasPoint: Point,
    e: MouseEvent | TouchEvent,
  ) {
    if (!isMarqueeDragging || !marqueeStart) return;

    const box = normalizeBoundingBox(marqueeStart, canvasPoint);
    // If the marquee was dragged more than a threshold, compute enclosed selection
    if (box.width > 4 || box.height > 4) {
      const enclosedIds = ctx.elements
        .filter((el) => isEnclosed(box, getElementBoundingBox(el)))
        .map((el) => el.id);

      const shiftKey = (e as MouseEvent).shiftKey ?? false;
      if (shiftKey) {
        ctx.setSelectedIds((prev) => Array.from(new Set([...prev, ...enclosedIds])));
      } else {
        ctx.setSelectedIds(enclosedIds);
      }
    }

    isMarqueeDragging = false;
    marqueeStart = null;
    ctx.setMarqueeBox(null);
  },
};
