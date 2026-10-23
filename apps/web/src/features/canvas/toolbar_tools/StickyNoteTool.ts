import { CANVAS_THEME } from "../constants/canvas-theme";
import { generateElementId } from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { Point, StickyElement } from "../types";

let startPoint: Point | null = null;

export const StickyNoteTool: CanvasToolHandler = {
  onPointerDown(_ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    startPoint = canvasPoint;
  },

  onPointerMove(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    if (!startPoint) return;

    const x = Math.min(startPoint.x, canvasPoint.x);
    const y = Math.min(startPoint.y, canvasPoint.y);
    const width = Math.max(Math.abs(canvasPoint.x - startPoint.x), 40);
    const height = Math.max(Math.abs(canvasPoint.y - startPoint.y), 40);

    const preview: StickyElement = {
      type: "sticky",
      id: "preview_sticky",
      x,
      y,
      width,
      height,
      cornerRadius: CANVAS_THEME.stickyNote.cornerRadius,
      colorScheme: CANVAS_THEME.stickyNote.defaultColor,
      stroke: "rgba(0,0,0,0.06)",
      strokeWidth: 1,
      fill: CANVAS_THEME.stickyNote.defaultColor,
      opacity: 1,
    };

    ctx.setCreatingElement(preview);
  },

  onPointerUp(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    if (!startPoint) return;

    const rawWidth = Math.abs(canvasPoint.x - startPoint.x);
    const rawHeight = Math.abs(canvasPoint.y - startPoint.y);

    const width = rawWidth > 40 ? rawWidth : 160;
    const height = rawHeight > 40 ? rawHeight : 160;
    const x = rawWidth > 40 ? Math.min(startPoint.x, canvasPoint.x) : startPoint.x;
    const y = rawHeight > 40 ? Math.min(startPoint.y, canvasPoint.y) : startPoint.y;

    startPoint = null;
    ctx.setCreatingElement(null);

    const newSticky: StickyElement = {
      type: "sticky",
      id: generateElementId("sticky"),
      x,
      y,
      width,
      height,
      cornerRadius: CANVAS_THEME.stickyNote.cornerRadius,
      colorScheme: CANVAS_THEME.stickyNote.defaultColor,
      stroke: "rgba(0,0,0,0.06)",
      strokeWidth: 1,
      fill: CANVAS_THEME.stickyNote.defaultColor,
      opacity: 1,
      text: "",
    };

    const nextElements = [...ctx.elements, newSticky];
    ctx.setElements(nextElements);
    ctx.recordSnapshot(nextElements);
    ctx.setSelectedIds([newSticky.id]);
    ctx.setActiveTool("select");
    ctx.startEditingElement(newSticky.id);
  },
};
