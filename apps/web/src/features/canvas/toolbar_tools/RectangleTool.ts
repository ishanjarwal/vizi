import { getCanvasTheme } from "../constants/canvas-theme";
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

    const themeConfig = getCanvasTheme(ctx.theme);

    const preview: RectangleElement = {
      type: "rectangle",
      id: "preview_rect",
      x,
      y,
      width,
      height,
      cornerRadius: themeConfig.defaultShape.cornerRadius,
      stroke: ctx.drawingStyles?.stroke ?? themeConfig.defaultShape.stroke,
      strokeWidth: ctx.drawingStyles?.strokeWidth ?? themeConfig.defaultShape.strokeWidth,
      fill: ctx.drawingStyles?.fill ?? themeConfig.defaultShape.fill,
      opacity: themeConfig.defaultShape.opacity,
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

    const themeConfig = getCanvasTheme(ctx.theme);

    if (width >= 4 && height >= 4) {
      const newRect: RectangleElement = {
        type: "rectangle",
        id: generateElementId("rect"),
        x,
        y,
        width,
        height,
        cornerRadius: themeConfig.defaultShape.cornerRadius,
        stroke: ctx.drawingStyles?.stroke ?? themeConfig.defaultShape.stroke,
        strokeWidth: ctx.drawingStyles?.strokeWidth ?? themeConfig.defaultShape.strokeWidth,
        fill: ctx.drawingStyles?.fill ?? themeConfig.defaultShape.fill,
        opacity: themeConfig.defaultShape.opacity,
      };

      const nextElements = [...ctx.elements, newRect];
      ctx.setElements(nextElements);
      ctx.recordSnapshot(nextElements);
      ctx.setSelectedIds([newRect.id]);
      ctx.setActiveTool("select");
    }
  },
};
