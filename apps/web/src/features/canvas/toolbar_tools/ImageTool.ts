import { CANVAS_THEME } from "../constants/canvas-theme";
import { generateElementId } from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { ImageElement, Point } from "../types";

export function promptAndInsertImage(
  ctx: ToolContext,
  insertAtCanvasPoint?: Point,
) {
  if (typeof document === "undefined") return;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const src = readerEvent.target?.result as string;
      if (!src) return;

      const img = new window.Image();
      img.onload = () => {
        const maxWidth = 400;
        const aspectRatio = img.width / img.height;
        const width = Math.min(img.width, maxWidth);
        const height = width / aspectRatio;

        const x = insertAtCanvasPoint
          ? insertAtCanvasPoint.x - width / 2
          : (-ctx.transform.x + window.innerWidth / 2) / ctx.transform.scale - width / 2;
        const y = insertAtCanvasPoint
          ? insertAtCanvasPoint.y - height / 2
          : (-ctx.transform.y + window.innerHeight / 2) / ctx.transform.scale - height / 2;

        const imageElement: ImageElement = {
          type: "image",
          id: generateElementId("img"),
          x,
          y,
          width,
          height,
          src,
          aspectRatio,
          stroke: "transparent",
          strokeWidth: 0,
          fill: "transparent",
          opacity: CANVAS_THEME.defaultShape.opacity,
        };

        const nextElements = [...ctx.elements, imageElement];
        ctx.recordSnapshot(nextElements);
        ctx.setSelectedIds([imageElement.id]);
        ctx.setActiveTool("select");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  input.click();
}

export const ImageTool: CanvasToolHandler = {
  onPointerDown(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    promptAndInsertImage(ctx, canvasPoint);
  },

  onPointerMove() {},

  onPointerUp() {},
};
