import { getCanvasTheme } from "../constants/canvas-theme";
import { generateElementId } from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { LineElement, Point } from "../types";

let startPoint: Point | null = null;

export const LineTool: CanvasToolHandler = {
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

    const themeConfig = getCanvasTheme(ctx.theme);

    const preview: LineElement = {
      type: "line",
      id: "preview_line",
      x: startPoint.x,
      y: startPoint.y,
      points: [0, 0, dx, dy],
      stroke: themeConfig.defaultShape.stroke,
      strokeWidth: themeConfig.defaultShape.strokeWidth,
      fill: "transparent",
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

    const themeConfig = getCanvasTheme(ctx.theme);

    if (length >= 5) {
      const newLine: LineElement = {
        type: "line",
        id: generateElementId("line"),
        x: initialX,
        y: initialY,
        points: [0, 0, dx, dy],
        stroke: themeConfig.defaultShape.stroke,
        strokeWidth: themeConfig.defaultShape.strokeWidth,
        fill: "transparent",
        opacity: themeConfig.defaultShape.opacity,
      };

      const nextElements = [...ctx.elements, newLine];
      ctx.recordSnapshot(nextElements);
      ctx.setSelectedIds([newLine.id]);
      ctx.setActiveTool("select");
    }
  },
};
