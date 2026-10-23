import {
  ArrowRight,
  Circle,
  Diamond,
  Download,
  Eraser,
  Hand,
  Image,
  Minus,
  MousePointer2,
  Pencil,
  Settings,
  Share2,
  Square,
  StickyNote,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import type { CanvasToolId, MenuItem, ToolItem } from "./types";

export const DEFAULT_ACTIVE_TOOL: CanvasToolId = "select";

export const DEFAULT_ZOOM_PERCENT = 100;

export const TOOL_ITEMS: readonly ToolItem[] = [
  {
    id: "pan",
    label: "Panning tool",
    icon: Hand,
    shortcut: "H",
    group: "navigation",
  },
  {
    id: "select",
    label: "Selection tool",
    icon: MousePointer2,
    shortcut: "V",
    group: "navigation",
  },
  {
    id: "rectangle",
    label: "Rectangle",
    icon: Square,
    shortcut: "R",
    group: "shapes",
  },
  {
    id: "diamond",
    label: "Diamond",
    icon: Diamond,
    shortcut: "D",
    group: "shapes",
  },
  {
    id: "ellipse",
    label: "Ellipse",
    icon: Circle,
    shortcut: "O",
    group: "shapes",
  },
  {
    id: "arrow",
    label: "Arrow",
    icon: ArrowRight,
    shortcut: "A",
    group: "shapes",
  },
  {
    id: "line",
    label: "Line",
    icon: Minus,
    shortcut: "L",
    group: "shapes",
  },
  {
    id: "pen",
    label: "Pen",
    icon: Pencil,
    shortcut: "P",
    group: "shapes",
  },
  {
    id: "text",
    label: "Textbox",
    icon: Type,
    shortcut: "T",
    group: "creation",
  },
  {
    id: "sticky",
    label: "Sticky note",
    icon: StickyNote,
    shortcut: "S",
    group: "creation",
  },
  {
    id: "eraser",
    label: "Eraser",
    icon: Eraser,
    shortcut: "E",
    group: "creation",
  },
  {
    id: "image",
    label: "Image tool",
    icon: Image,
    shortcut: "I",
    group: "creation",
  },
] as const;

export const TOP_MENU_ITEMS: readonly MenuItem[] = [
  {
    id: "open",
    label: "Open / Import",
    icon: Upload,
    shortcut: "Ctrl + O",
  },
  {
    id: "save",
    label: "Save / Export JSON",
    icon: Download,
    shortcut: "Ctrl + S",
  },
  {
    id: "export-image",
    label: "Export PNG image",
    icon: Image,
    shortcut: "Ctrl + Shift + E",
    hasSeparatorBelow: true,
  },
  {
    id: "share",
    label: "Live collaboration",
    icon: Share2,
  },
  {
    id: "settings",
    label: "Canvas settings",
    icon: Settings,
    hasSeparatorBelow: true,
  },
  {
    id: "reset",
    label: "Reset canvas",
    icon: Trash2,
    isDestructive: true,
  },
] as const;
