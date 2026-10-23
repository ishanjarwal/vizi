import { CANVAS_THEME } from "../constants/canvas-theme";
import { generateElementId } from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { Point, RectangleElement } from "../types";

let startPoint: Point | null = null;

export const RectangleTool: CanvasToolHandler = {
  onPointerDown(_ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    startPoint = canvasPoint;
  },

  onPointerMove(
    ctx: ToolContext,
    _screenPoint: Point,
    canvasPoint: Point,
    e: MouseEvent | TouchEvent,
  ) {
    if (!startPoint) return;

    const isShift = "shiftKey" in e ? Boolean(e.shiftKey) : false;
    let width = Math.abs(canvasPoint.x - startPoint.x);
    let height = Math.abs(canvasPoint.y - startPoint.y);

    if (isShift) {
      const size = Math.max(width, height);
      width = size;
      height = size;
    }

    const x = canvasPoint.x >= startPoint.x ? startPoint.x : startPoint.x - width;
    const y = canvasPoint.y >= startPoint.y ? startPoint.y : startPoint.y - height;

    const preview: RectangleElement = {
      type: "rectangle",
      id: "preview_rect",
      x,
      y,
      width,
      height,
      cornerRadius: CANVAS_THEME.defaultShape.cornerRadius,
      stroke: CANVAS_THEME.defaultShape.stroke,
      strokeWidth: CANVAS_THEME.defaultShape.strokeWidth,
      fill: CANVAS_THEME.defaultShape.fill,
      opacity: CANVAS_THEME.defaultShape.opacity,
    };

    ctx.setCreatingElement(preview);
  },

  onPointerUp(
    ctx: ToolContext,
    _screenPoint: Point,
    canvasPoint: Point,
    e: MouseEvent | TouchEvent,
  ) {
    if (!startPoint) return;

    const isShift = "shiftKey" in e ? Boolean(e.shiftKey) : false;
    let width = Math.abs(canvasPoint.x - startPoint.x);
    let height = Math.abs(canvasPoint.y - startPoint.y);

    if (isShift) {
      const size = Math.max(width, height);
      width = size;
      height = size;
    }

    const x = canvasPoint.x >= startPoint.x ? startPoint.x : startPoint.x - width;
    const y = canvasPoint.y >= startPoint.y ? startPoint.y : startPoint.y - height;

    startPoint = null;
    ctx.setCreatingElement(null);

    if (width >= 4 && height >= 4) {
      const newRect: RectangleElement = {
        type: "rectangle",
        id: generateElementId("rect"),
        x,
        y,
        width,
        height,
        cornerRadius: CANVAS_THEME.defaultShape.cornerRadius,
        stroke: CANVAS_THEME.defaultShape.stroke,
        strokeWidth: CANVAS_THEME.defaultShape.strokeWidth,
        fill: CANVAS_THEME.defaultShape.fill,
        opacity: CANVAS_THEME.defaultShape.opacity,
      };

      const nextElements = [...ctx.elements, newRect];
      ctx.recordSnapshot(nextElements);
      ctx.setSelectedIds([newRect.id]);
      ctx.setActiveTool("select");
    }
  },
};
