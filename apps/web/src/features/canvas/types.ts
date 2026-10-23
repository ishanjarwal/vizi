import type { LucideIcon } from "lucide-react";

export type CanvasToolId =
  | "pan"
  | "select"
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "arrow"
  | "line"
  | "pen"
  | "text"
  | "sticky"
  | "eraser"
  | "image";

export type ToolGroup = "navigation" | "shapes" | "creation";

export interface ToolItem {
  id: CanvasToolId;
  label: string;
  icon: LucideIcon;
  shortcut: string;
  group: ToolGroup;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  isDestructive?: boolean;
  hasSeparatorBelow?: boolean;
}

export interface ToolbarProps {
  className?: string;
  activeToolId?: CanvasToolId;
}

export interface TopMenuProps {
  className?: string;
}

export interface TopRightMenuProps {
  className?: string;
  children?: React.ReactNode;
}

export interface BottomLeftOptionsProps {
  className?: string;
  zoom?: number;
  canUndo?: boolean;
  canRedo?: boolean;
}

export interface EmptyCardProps {
  className?: string;
}
