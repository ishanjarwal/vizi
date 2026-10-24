import { generateElementId } from "../utils/helper";
import type { CanvasToolHandler, ToolContext } from "./types";
import type { ImageElement, Point } from "../types";

export interface PendingImage {
  src: string;
  width: number;
  height: number;
  aspectRatio: number;
}

let currentPendingImage: PendingImage | null = null;
let isPointerDown = false;
let dragStartPoint: Point | null = null;

export function getPendingImage(): PendingImage | null {
  return currentPendingImage;
}

export function setPendingImage(img: PendingImage | null) {
  currentPendingImage = img;
  isPointerDown = false;
  dragStartPoint = null;
}

export function promptImageFile(callbacks?: {
  onLoaded?: (img: PendingImage) => void;
  onCancel?: () => void;
}) {
  if (typeof document === "undefined") return;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  let handled = false;

  const cleanup = () => {
    window.removeEventListener("focus", handleWindowFocus);
  };

  const handleWindowFocus = () => {
    setTimeout(() => {
      cleanup();
      if (!handled && !input.files?.length) {
        callbacks?.onCancel?.();
      }
    }, 600);
  };

  input.addEventListener("cancel", () => {
    handled = true;
    cleanup();
    callbacks?.onCancel?.();
  });

  input.addEventListener("change", (e) => {
    handled = true;
    cleanup();
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) {
      callbacks?.onCancel?.();
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const src = readerEvent.target?.result as string;
      if (!src) {
        callbacks?.onCancel?.();
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        const maxWidth = 360;
        const naturalWidth = img.naturalWidth || img.width || 300;
        const naturalHeight = img.naturalHeight || img.height || 200;
        const aspectRatio = naturalWidth / naturalHeight;
        const width = Math.min(naturalWidth, maxWidth);
        const height = width / aspectRatio;

        const pending: PendingImage = {
          src,
          width: Math.round(width),
          height: Math.round(height),
          aspectRatio,
        };

        currentPendingImage = pending;
        callbacks?.onLoaded?.(pending);
      };
      img.onerror = () => {
        callbacks?.onCancel?.();
      };
      img.src = src;
    };
    reader.onerror = () => {
      callbacks?.onCancel?.();
    };
    reader.readAsDataURL(file);
  });

  window.addEventListener("focus", handleWindowFocus, { once: true });
  input.click();
}

export function promptAndInsertImage(
  ctx: ToolContext,
  insertAtCanvasPoint?: Point,
) {
  promptImageFile({
    onLoaded: (pending) => {
      const x = insertAtCanvasPoint
        ? insertAtCanvasPoint.x - pending.width / 2
        : (-ctx.transform.x + window.innerWidth / 2) / ctx.transform.scale - pending.width / 2;
      const y = insertAtCanvasPoint
        ? insertAtCanvasPoint.y - pending.height / 2
        : (-ctx.transform.y + window.innerHeight / 2) / ctx.transform.scale - pending.height / 2;

      const imageElement: ImageElement = {
        type: "image",
        id: generateElementId("img"),
        x: Math.round(x),
        y: Math.round(y),
        width: pending.width,
        height: pending.height,
        src: pending.src,
        aspectRatio: pending.aspectRatio,
        stroke: "transparent",
        strokeWidth: 0,
        fill: "transparent",
        opacity: 1,
      };

      const nextElements = [...ctx.elements, imageElement];
      ctx.setElements(nextElements);
      ctx.recordSnapshot(nextElements);
      ctx.setSelectedIds([imageElement.id]);
      ctx.setActiveTool("select");
    },
    onCancel: () => {
      ctx.setActiveTool("select");
    },
  });
}

export const ImageTool: CanvasToolHandler = {
  onPointerDown(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    if (!currentPendingImage) {
      promptImageFile({
        onLoaded: () => {},
        onCancel: () => ctx.setActiveTool("select"),
      });
      return;
    }
    isPointerDown = true;
    dragStartPoint = canvasPoint;
  },

  onPointerMove(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    if (!currentPendingImage) return;

    if (!isPointerDown || !dragStartPoint) {
      // Hover preview following the cursor
      const preview: ImageElement = {
        type: "image",
        id: "preview_image",
        x: Math.round(canvasPoint.x - currentPendingImage.width / 2),
        y: Math.round(canvasPoint.y - currentPendingImage.height / 2),
        width: currentPendingImage.width,
        height: currentPendingImage.height,
        src: currentPendingImage.src,
        aspectRatio: currentPendingImage.aspectRatio,
        stroke: "transparent",
        strokeWidth: 0,
        fill: "transparent",
        opacity: 0.85,
      };
      ctx.setCreatingElement(preview);
      return;
    }

    // Dragging with mouse down: scale/position box while maintaining aspect ratio
    const rawDx = canvasPoint.x - dragStartPoint.x;
    const rawDy = canvasPoint.y - dragStartPoint.y;
    const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

    if (dist > 8) {
      const dragWidth = Math.abs(rawDx);
      const dragHeight = Math.abs(rawDy);
      const width = Math.max(
        40,
        Math.max(dragWidth, dragHeight * currentPendingImage.aspectRatio),
      );
      const height = width / currentPendingImage.aspectRatio;

      const x = rawDx >= 0 ? dragStartPoint.x : dragStartPoint.x - width;
      const y = rawDy >= 0 ? dragStartPoint.y : dragStartPoint.y - height;

      const preview: ImageElement = {
        type: "image",
        id: "preview_image",
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
        src: currentPendingImage.src,
        aspectRatio: currentPendingImage.aspectRatio,
        stroke: "transparent",
        strokeWidth: 0,
        fill: "transparent",
        opacity: 0.9,
      };
      ctx.setCreatingElement(preview);
    } else {
      const preview: ImageElement = {
        type: "image",
        id: "preview_image",
        x: Math.round(canvasPoint.x - currentPendingImage.width / 2),
        y: Math.round(canvasPoint.y - currentPendingImage.height / 2),
        width: currentPendingImage.width,
        height: currentPendingImage.height,
        src: currentPendingImage.src,
        aspectRatio: currentPendingImage.aspectRatio,
        stroke: "transparent",
        strokeWidth: 0,
        fill: "transparent",
        opacity: 0.85,
      };
      ctx.setCreatingElement(preview);
    }
  },

  onPointerUp(ctx: ToolContext, _screenPoint: Point, canvasPoint: Point) {
    if (!currentPendingImage) {
      isPointerDown = false;
      dragStartPoint = null;
      return;
    }

    let finalX: number;
    let finalY: number;
    let finalWidth: number;
    let finalHeight: number;

    if (dragStartPoint) {
      const rawDx = canvasPoint.x - dragStartPoint.x;
      const rawDy = canvasPoint.y - dragStartPoint.y;
      const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

      if (dist > 8) {
        const dragWidth = Math.abs(rawDx);
        const dragHeight = Math.abs(rawDy);
        finalWidth = Math.round(
          Math.max(40, Math.max(dragWidth, dragHeight * currentPendingImage.aspectRatio)),
        );
        finalHeight = Math.round(finalWidth / currentPendingImage.aspectRatio);
        finalX = Math.round(rawDx >= 0 ? dragStartPoint.x : dragStartPoint.x - finalWidth);
        finalY = Math.round(rawDy >= 0 ? dragStartPoint.y : dragStartPoint.y - finalHeight);
      } else {
        finalWidth = currentPendingImage.width;
        finalHeight = currentPendingImage.height;
        finalX = Math.round(canvasPoint.x - finalWidth / 2);
        finalY = Math.round(canvasPoint.y - finalHeight / 2);
      }
    } else {
      finalWidth = currentPendingImage.width;
      finalHeight = currentPendingImage.height;
      finalX = Math.round(canvasPoint.x - finalWidth / 2);
      finalY = Math.round(canvasPoint.y - finalHeight / 2);
    }

    const placedImage: ImageElement = {
      type: "image",
      id: generateElementId("img"),
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight,
      src: currentPendingImage.src,
      aspectRatio: currentPendingImage.aspectRatio,
      stroke: "transparent",
      strokeWidth: 0,
      fill: "transparent",
      opacity: 1,
    };

    const nextElements = [...ctx.elements, placedImage];
    ctx.setElements(nextElements);
    ctx.recordSnapshot(nextElements);
    ctx.setSelectedIds([placedImage.id]);
    ctx.setCreatingElement(null);

    currentPendingImage = null;
    isPointerDown = false;
    dragStartPoint = null;

    ctx.setActiveTool("select");
  },
};
