import { getCanvasTheme } from "../constants/canvas-theme";
import { generateElementId } from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { DiamondElement, Point } from "../types";

let startPoint: Point | null = null;

export const DiamondTool: CanvasToolHandler = {
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

    const preview: DiamondElement = {
      type: "diamond",
      id: "preview_diamond",
      x,
      y,
      width,
      height,
      stroke: themeConfig.defaultShape.stroke,
      strokeWidth: themeConfig.defaultShape.strokeWidth,
      fill: themeConfig.defaultShape.fill,
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
      const newDiamond: DiamondElement = {
        type: "diamond",
        id: generateElementId("diamond"),
        x,
        y,
        width,
        height,
        stroke: themeConfig.defaultShape.stroke,
        strokeWidth: themeConfig.defaultShape.strokeWidth,
        fill: themeConfig.defaultShape.fill,
        opacity: themeConfig.defaultShape.opacity,
      };

      const nextElements = [...ctx.elements, newDiamond];
      ctx.recordSnapshot(nextElements);
      ctx.setSelectedIds([newDiamond.id]);
      ctx.setActiveTool("select");
    }
  },
};
