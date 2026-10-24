"use client";

import { useEffect, useRef } from "react";
import { HOTKEYS, KEYBOARD_TOOL_SHORTCUTS } from "../constants/shortcuts";
import type { ToolType } from "../types";

export interface UseKeyboardShortcutsOptions {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isEditingText: boolean;
}

export function useKeyboardShortcuts({
  activeTool,
  setActiveTool,
  deleteSelected,
  undo,
  redo,
  isEditingText,
}: UseKeyboardShortcutsOptions) {
  const previousToolBeforeSpaceRef = useRef<ToolType | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in a form field or text editor overlay
      const target = e.target as HTMLElement | null;
      if (
        isEditingText ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key.toLowerCase() === HOTKEYS.UNDO) {
          if (e.shiftKey) {
            e.preventDefault();
            redo();
          } else {
            e.preventDefault();
            undo();
          }
          return;
        }
        if (e.key.toLowerCase() === HOTKEYS.REDO) {
          e.preventDefault();
          redo();
          return;
        }
      }

      // Delete / Backspace
      if ((HOTKEYS.DELETE as readonly string[]).includes(e.key)) {
        e.preventDefault();
        deleteSelected();
        return;
      }

      // Escape to cancel active tool back to select
      if (e.key === HOTKEYS.ESCAPE) {
        if (activeTool !== "select") {
          e.preventDefault();
          setActiveTool("select");
          return;
        }
      }

      // Spacebar temporary pan
      if (e.key === HOTKEYS.SPACE && !e.repeat) {
        if (activeTool !== "pan") {
          previousToolBeforeSpaceRef.current = activeTool;
          setActiveTool("pan");
        }
        return;
      }

      // Tool shortcuts (single letter, no ctrl/meta/alt)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toLowerCase();
        const matchedTool = KEYBOARD_TOOL_SHORTCUTS[key];
        if (matchedTool) {
          e.preventDefault();
          setActiveTool(matchedTool);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === HOTKEYS.SPACE && previousToolBeforeSpaceRef.current) {
        setActiveTool(previousToolBeforeSpaceRef.current);
        previousToolBeforeSpaceRef.current = null;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    activeTool,
    setActiveTool,
    deleteSelected,
    undo,
    redo,
    isEditingText,
  ]);
}
