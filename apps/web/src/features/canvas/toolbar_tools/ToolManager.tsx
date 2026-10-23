import * as React from "react";
import type { ToolManagerProps as Props, ToolType } from "../types";
import { ArrowTool } from "./ArrowTool";
import { DiamondTool } from "./DiamondTool";
import { EllipseTool } from "./EllipseTool";
import { EraserTool } from "./EraserTool";
import { ImageTool } from "./ImageTool";
import { LineTool } from "./LineTool";
import { PanTool } from "./PanTool";
import { PenTool } from "./PenTool";
import { RectangleTool } from "./RectangleTool";
import { SelectionTool } from "./SelectionTool";
import { StickyNoteTool } from "./StickyNoteTool";
import { TextTool } from "./TextTool";
import type { CanvasToolHandler } from "./types";

export const TOOL_HANDLERS: Record<ToolType, CanvasToolHandler> = {
  select: SelectionTool,
  pan: PanTool,
  eraser: EraserTool,
  rectangle: RectangleTool,
  ellipse: EllipseTool,
  diamond: DiamondTool,
  line: LineTool,
  arrow: ArrowTool,
  sticky: StickyNoteTool,
  text: TextTool,
  image: ImageTool,
  pen: PenTool,
};

export function getToolHandler(tool: ToolType): CanvasToolHandler {
  return TOOL_HANDLERS[tool] ?? SelectionTool;
}

export function ToolManager({ children }: Props) {
  return <>{children}</>;
}
