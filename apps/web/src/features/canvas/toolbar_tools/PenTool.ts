import { getCanvasTheme } from "../constants/canvas-theme";
import { generateElementId } from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { PenElement, Point } from "../types";

let startPoint: Point | null = null;
let currentPoints: number[] = [];

export const PenTool: CanvasToolHandler = {
  onPointerDown(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    if (ctx.selectedIds.length > 0) {
      ctx.setSelectedIds([]);
    }
    startPoint = canvasPoint;
    currentPoints = [0, 0];
  },

  onPointerMove(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    if (!startPoint) return;

    const dx = canvasPoint.x - startPoint.x;
    const dy = canvasPoint.y - startPoint.y;
    currentPoints.push(dx, dy);

    const themeConfig = getCanvasTheme(ctx.theme);

    const preview: PenElement = {
      type: "pen",
      id: "preview_pen",
      x: startPoint.x,
      y: startPoint.y,
      points: [...currentPoints],
      stroke: themeConfig.defaultShape.stroke,
      strokeWidth: themeConfig.defaultShape.strokeWidth,
      fill: "transparent",
      opacity: themeConfig.defaultShape.opacity,
    };

    ctx.setCreatingElement(preview);
  },

  onPointerUp(ctx: ToolContext) {
    if (!startPoint || currentPoints.length < 4) {
      startPoint = null;
      currentPoints = [];
      ctx.setCreatingElement(null);
      return;
    }

    const initialX = startPoint.x;
    const initialY = startPoint.y;
    const finalPoints = [...currentPoints];

    startPoint = null;
    currentPoints = [];
    ctx.setCreatingElement(null);

    const themeConfig = getCanvasTheme(ctx.theme);

    const newPen: PenElement = {
      type: "pen",
      id: generateElementId("pen"),
      x: initialX,
      y: initialY,
      points: finalPoints,
      stroke: themeConfig.defaultShape.stroke,
      strokeWidth: themeConfig.defaultShape.strokeWidth,
      fill: "transparent",
      opacity: themeConfig.defaultShape.opacity,
    };

    const nextElements = [...ctx.elements, newPen];
    ctx.recordSnapshot(nextElements);
    ctx.setSelectedIds([]);
  },
};
