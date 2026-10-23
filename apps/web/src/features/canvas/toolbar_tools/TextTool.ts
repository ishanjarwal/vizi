import { getCanvasTheme } from "../constants/canvas-theme";
import { generateElementId } from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { Point, TextElement } from "../types";

export const TextTool: CanvasToolHandler = {
  onPointerDown() {
    // Handled on pointer up to prevent drag conflict
  },

  onPointerMove() {},

  onPointerUp(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    const themeConfig = getCanvasTheme(ctx.theme);

    const newText: TextElement = {
      type: "text",
      id: generateElementId("text"),
      x: canvasPoint.x,
      y: canvasPoint.y,
      text: "",
      fontSize: 24,
      fontFamily: themeConfig.fonts.canvas,
      stroke: themeConfig.defaultShape.stroke,
      strokeWidth: 1,
      fill: "transparent",
      opacity: 1,
    };

    const nextElements = [...ctx.elements, newText];
    ctx.setElements(nextElements);
    ctx.recordSnapshot(nextElements);
    ctx.setSelectedIds([newText.id]);
    ctx.startEditingElement(newText.id);
    ctx.setActiveTool("select");
  },
};
