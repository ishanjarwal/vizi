import type { ToolType } from "../types";

export const KEYBOARD_TOOL_SHORTCUTS: Record<string, ToolType> = {
  v: "select",
  h: "pan",
  r: "rectangle",
  d: "diamond",
  o: "ellipse",
  l: "line",
  a: "arrow",
  p: "pen",
  s: "sticky",
  t: "text",
  e: "eraser",
  i: "image",
};

export const HOTKEYS = {
  DELETE: ["Delete", "Backspace"],
  UNDO: "z",
  REDO: "y",
  REDO_SHIFT: "Z",
  SPACE: " ",
  ESCAPE: "Escape",
} as const;
