import { CANVAS_THEME } from "../constants/canvas-theme";
import { generateElementId } from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { ArrowElement, Point } from "../types";

let startPoint: Point | null = null;

export const ArrowTool: CanvasToolHandler = {
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

    let dx = canvasPoint.x - startPoint.x;
    let dy = canvasPoint.y - startPoint.y;

    const isShift = "shiftKey" in e ? Boolean(e.shiftKey) : false;
    if (isShift) {
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const step = Math.PI / 4; // 45 degrees
      const snappedAngle = Math.round(angle / step) * step;
      dx = Math.round(length * Math.cos(snappedAngle));
      dy = Math.round(length * Math.sin(snappedAngle));
    }

    const preview: ArrowElement = {
      type: "arrow",
      id: "preview_arrow",
      x: startPoint.x,
      y: startPoint.y,
      points: [0, 0, dx, dy],
      stroke: CANVAS_THEME.defaultShape.stroke,
      strokeWidth: CANVAS_THEME.defaultShape.strokeWidth,
      fill: CANVAS_THEME.defaultShape.stroke,
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

    let dx = canvasPoint.x - startPoint.x;
    let dy = canvasPoint.y - startPoint.y;

    const isShift = "shiftKey" in e ? Boolean(e.shiftKey) : false;
    if (isShift) {
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const step = Math.PI / 4; // 45 degrees
      const snappedAngle = Math.round(angle / step) * step;
      dx = Math.round(length * Math.cos(snappedAngle));
      dy = Math.round(length * Math.sin(snappedAngle));
    }

    const length = Math.sqrt(dx * dx + dy * dy);
    const initialX = startPoint.x;
    const initialY = startPoint.y;
    startPoint = null;
    ctx.setCreatingElement(null);

    if (length >= 5) {
      const newArrow: ArrowElement = {
        type: "arrow",
        id: generateElementId("arrow"),
        x: initialX,
        y: initialY,
        points: [0, 0, dx, dy],
        stroke: CANVAS_THEME.defaultShape.stroke,
        strokeWidth: CANVAS_THEME.defaultShape.strokeWidth,
        fill: CANVAS_THEME.defaultShape.stroke,
        opacity: CANVAS_THEME.defaultShape.opacity,
      };

      const nextElements = [...ctx.elements, newArrow];
      ctx.recordSnapshot(nextElements);
      ctx.setSelectedIds([newArrow.id]);
      ctx.setActiveTool("select");
    }
  },
};
