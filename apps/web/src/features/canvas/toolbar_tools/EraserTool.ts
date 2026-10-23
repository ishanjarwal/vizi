import { isPointInElement } from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { Point } from "../types";

let isErasing = false;

export const EraserTool: CanvasToolHandler = {
  onPointerDown(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    isErasing = true;

    const hitIds = ctx.elements
      .filter((el) => isPointInElement(canvasPoint, el, 14))
      .map((el) => el.id);

    ctx.setPendingDeleteIds(hitIds);
  },

  onPointerMove(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    if (!isErasing) return;

    const hitIds = ctx.elements
      .filter((el) => isPointInElement(canvasPoint, el, 14))
      .map((el) => el.id);

    if (hitIds.length > 0) {
      ctx.setPendingDeleteIds((prev) => Array.from(new Set([...prev, ...hitIds])));
    }
  },

  onPointerUp(ctx: ToolContext) {
    if (!isErasing) return;
    isErasing = false;

    const toDelete = ctx.pendingDeleteIds;
    if (toDelete.length > 0) {
      const remaining = ctx.elements.filter((el) => !toDelete.includes(el.id));
      ctx.setElements(remaining);
      ctx.recordSnapshot(remaining);
      ctx.setSelectedIds((prev) => prev.filter((id) => !toDelete.includes(id)));
    }

    ctx.setPendingDeleteIds([]);
  },
};
