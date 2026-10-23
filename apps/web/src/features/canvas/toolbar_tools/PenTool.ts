import { CANVAS_THEME } from "../constants/canvas-theme";
import { generateElementId } from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { PenElement, Point } from "../types";

let startPoint: Point | null = null;
let currentPoints: number[] = [];

export const PenTool: CanvasToolHandler = {
  onPointerDown(_ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    startPoint = canvasPoint;
    currentPoints = [0, 0];
  },

  onPointerMove(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    if (!startPoint) return;

    const dx = canvasPoint.x - startPoint.x;
    const dy = canvasPoint.y - startPoint.y;
    currentPoints.push(dx, dy);

    const preview: PenElement = {
      type: "pen",
      id: "preview_pen",
      x: startPoint.x,
      y: startPoint.y,
      points: [...currentPoints],
      stroke: CANVAS_THEME.defaultShape.stroke,
      strokeWidth: CANVAS_THEME.defaultShape.strokeWidth,
      fill: "transparent",
      opacity: CANVAS_THEME.defaultShape.opacity,
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

    const newPen: PenElement = {
      type: "pen",
      id: generateElementId("pen"),
      x: initialX,
      y: initialY,
      points: finalPoints,
      stroke: CANVAS_THEME.defaultShape.stroke,
      strokeWidth: CANVAS_THEME.defaultShape.strokeWidth,
      fill: "transparent",
      opacity: CANVAS_THEME.defaultShape.opacity,
    };

    const nextElements = [...ctx.elements, newPen];
    ctx.recordSnapshot(nextElements);
    ctx.setSelectedIds([newPen.id]);
    ctx.setActiveTool("select");
  },
};
