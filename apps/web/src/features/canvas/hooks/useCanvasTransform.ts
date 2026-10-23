"use client";

import { useCallback, useState } from "react";
import { CANVAS_THEME } from "../constants/canvas-theme";
import type { Point, ViewportTransform } from "../types";

export interface UseCanvasTransformReturn {
  transform: ViewportTransform;
  setTransform: React.Dispatch<React.SetStateAction<ViewportTransform>>;
  handleWheel: (
    deltaX: number,
    deltaY: number,
    ctrlKey: boolean,
    pointerPos: Point | null,
  ) => void;
  panBy: (dx: number, dy: number) => void;
  zoomIn: (anchor?: Point) => void;
  zoomOut: (anchor?: Point) => void;
  resetZoom: () => void;
}

export function useCanvasTransform(
  initialTransform: ViewportTransform = { x: 0, y: 0, scale: CANVAS_THEME.zoom.default },
): UseCanvasTransformReturn {
  const [transform, setTransform] = useState<ViewportTransform>(initialTransform);

  const zoomIn = useCallback(
    (anchor?: Point) => {
      setTransform((prev) => {
        const nextScale = prev.scale * 1.2;
        const clampedScale = Math.min(nextScale, CANVAS_THEME.zoom.max);
        const center = anchor ?? {
          x: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
          y: typeof window !== "undefined" ? window.innerHeight / 2 : 400,
        };
        const newX = center.x - (center.x - prev.x) * (clampedScale / prev.scale);
        const newY = center.y - (center.y - prev.y) * (clampedScale / prev.scale);
        return { x: newX, y: newY, scale: Number(clampedScale.toFixed(3)) };
      });
    },
    [],
  );

  const zoomOut = useCallback(
    (anchor?: Point) => {
      setTransform((prev) => {
        const nextScale = prev.scale / 1.2;
        const clampedScale = Math.max(nextScale, CANVAS_THEME.zoom.min);
        const center = anchor ?? {
          x: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
          y: typeof window !== "undefined" ? window.innerHeight / 2 : 400,
        };
        const newX = center.x - (center.x - prev.x) * (clampedScale / prev.scale);
        const newY = center.y - (center.y - prev.y) * (clampedScale / prev.scale);
        return { x: newX, y: newY, scale: Number(clampedScale.toFixed(3)) };
      });
    },
    [],
  );

  const resetZoom = useCallback(() => {
    setTransform((prev) => {
      const center = {
        x: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
        y: typeof window !== "undefined" ? window.innerHeight / 2 : 400,
      };
      const clampedScale = CANVAS_THEME.zoom.default;
      const newX = center.x - (center.x - prev.x) * (clampedScale / prev.scale);
      const newY = center.y - (center.y - prev.y) * (clampedScale / prev.scale);
      return { x: newX, y: newY, scale: clampedScale };
    });
  }, []);

  const panBy = useCallback((dx: number, dy: number) => {
    setTransform((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  const handleWheel = useCallback(
    (
      deltaX: number,
      deltaY: number,
      ctrlKey: boolean,
      pointerPos: Point | null,
    ) => {
      if (ctrlKey) {
        // Zoom anchored to pointer position
        const zoomFactor = deltaY < 0 ? 1.05 : 0.95;
        setTransform((prev) => {
          const nextScale = prev.scale * zoomFactor;
          const clampedScale = Math.min(
            Math.max(nextScale, CANVAS_THEME.zoom.min),
            CANVAS_THEME.zoom.max,
          );
          if (clampedScale === prev.scale) return prev;

          const anchor = pointerPos ?? {
            x: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
            y: typeof window !== "undefined" ? window.innerHeight / 2 : 400,
          };

          const newX = anchor.x - (anchor.x - prev.x) * (clampedScale / prev.scale);
          const newY = anchor.y - (anchor.y - prev.y) * (clampedScale / prev.scale);

          return {
            x: newX,
            y: newY,
            scale: Number(clampedScale.toFixed(3)),
          };
        });
      } else {
        // 2-finger trackpad or wheel pan
        setTransform((prev) => ({
          ...prev,
          x: prev.x - deltaX,
          y: prev.y - deltaY,
        }));
      }
    },
    [],
  );

  return {
    transform,
    setTransform,
    handleWheel,
    panBy,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
