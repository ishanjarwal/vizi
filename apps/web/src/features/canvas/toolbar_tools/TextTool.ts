import { CANVAS_THEME } from "../constants/canvas-theme";
import { generateElementId } from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { Point, TextElement } from "../types";

export const TextTool: CanvasToolHandler = {
  onPointerDown() {
    // Handled on pointer up to prevent drag conflict
  },

  onPointerMove() {},

  onPointerUp(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    const newText: TextElement = {
      type: "text",
      id: generateElementId("text"),
      x: canvasPoint.x,
      y: canvasPoint.y,
      text: "",
      fontSize: 24,
      fontFamily: CANVAS_THEME.fonts.canvas,
      stroke: "#1e1e1e",
      strokeWidth: 1,
      fill: "transparent",
      opacity: 1,
    };

    const nextElements = [...ctx.elements, newText];
    ctx.setElements(nextElements);
    ctx.setSelectedIds([newText.id]);
    ctx.startEditingElement(newText.id);
    ctx.setActiveTool("select");
  },
};
