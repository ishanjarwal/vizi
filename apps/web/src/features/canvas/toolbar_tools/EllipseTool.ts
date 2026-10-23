import { getCanvasTheme } from "../constants/canvas-theme";
import { generateElementId } from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { EllipseElement, Point } from "../types";

let startPoint: Point | null = null;

export const EllipseTool: CanvasToolHandler = {
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
    let radiusX = Math.abs(canvasPoint.x - startPoint.x) / 2;
    let radiusY = Math.abs(canvasPoint.y - startPoint.y) / 2;

    if (isShift) {
      const radius = Math.max(radiusX, radiusY);
      radiusX = radius;
      radiusY = radius;
    }

    const signX = canvasPoint.x >= startPoint.x ? 1 : -1;
    const signY = canvasPoint.y >= startPoint.y ? 1 : -1;
    const x = startPoint.x + signX * radiusX;
    const y = startPoint.y + signY * radiusY;

    const themeConfig = getCanvasTheme(ctx.theme);

    const preview: EllipseElement = {
      type: "ellipse",
      id: "preview_ellipse",
      x,
      y,
      radiusX,
      radiusY,
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
    let radiusX = Math.abs(canvasPoint.x - startPoint.x) / 2;
    let radiusY = Math.abs(canvasPoint.y - startPoint.y) / 2;

    if (isShift) {
      const radius = Math.max(radiusX, radiusY);
      radiusX = radius;
      radiusY = radius;
    }

    const signX = canvasPoint.x >= startPoint.x ? 1 : -1;
    const signY = canvasPoint.y >= startPoint.y ? 1 : -1;
    const x = startPoint.x + signX * radiusX;
    const y = startPoint.y + signY * radiusY;

    startPoint = null;
    ctx.setCreatingElement(null);

    const themeConfig = getCanvasTheme(ctx.theme);

    if (radiusX >= 2 && radiusY >= 2) {
      const newEllipse: EllipseElement = {
        type: "ellipse",
        id: generateElementId("ellipse"),
        x,
        y,
        radiusX,
        radiusY,
        stroke: themeConfig.defaultShape.stroke,
        strokeWidth: themeConfig.defaultShape.strokeWidth,
        fill: themeConfig.defaultShape.fill,
        opacity: themeConfig.defaultShape.opacity,
      };

      const nextElements = [...ctx.elements, newEllipse];
      ctx.recordSnapshot(nextElements);
      ctx.setSelectedIds([newEllipse.id]);
      ctx.setActiveTool("select");
    }
  },
};
