"use client";

import { useCallback, useState } from "react";
import { CANVAS_THEME } from "../constants/canvas-theme";
import type { CanvasElement } from "../types";

export interface UseCanvasHistoryReturn {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  recordSnapshot: (nextElements?: CanvasElement[]) => void;
  clearHistory: (initialElements?: CanvasElement[]) => void;
  mapHistoryElements: (mapper: (el: CanvasElement) => CanvasElement) => void;
}

export function useCanvasHistory(
  initialElements: CanvasElement[] = [],
): UseCanvasHistoryReturn {
  const [history, setHistory] = useState<{
    past: CanvasElement[][];
    present: CanvasElement[];
    future: CanvasElement[][];
  }>({
    past: [],
    present: initialElements,
    future: [],
  });

  const elements = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const setElements = useCallback(
    (action: React.SetStateAction<CanvasElement[]>) => {
      setHistory((prev) => {
        const nextPresent =
          typeof action === "function" ? action(prev.present) : action;
        return {
          ...prev,
          present: nextPresent,
        };
      });
    },
    [],
  );

  const recordSnapshot = useCallback(
    (nextElements?: CanvasElement[]) => {
      setHistory((prev) => {
        const targetElements =
          nextElements !== undefined ? nextElements : prev.present;
        const newPast = [
          ...prev.past.slice(-(CANVAS_THEME.history.maxDepth - 1)),
          prev.present,
        ];
        return {
          past: newPast,
          present: targetElements,
          future: [],
        };
      });
    },
    [],
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const clearHistory = useCallback((resetElements: CanvasElement[] = []) => {
    setHistory({
      past: [],
      present: resetElements,
      future: [],
    });
  }, []);

  const mapHistoryElements = useCallback(
    (mapper: (el: CanvasElement) => CanvasElement) => {
      setHistory((prev) => ({
        past: prev.past.map((step) => step.map(mapper)),
        present: prev.present.map(mapper),
        future: prev.future.map((step) => step.map(mapper)),
      }));
    },
    [],
  );

  return {
    elements,
    setElements,
    undo,
    redo,
    canUndo,
    canRedo,
    recordSnapshot,
    clearHistory,
    mapHistoryElements,
  };
}
