import type {
  BoundingBox,
  CanvasElement,
  EditingTextState,
  Point,
  ToolType,
  ViewportTransform,
} from "../types";

export interface ToolContext {
  elements: CanvasElement[];
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  pendingDeleteIds: string[];
  setPendingDeleteIds: React.Dispatch<React.SetStateAction<string[]>>;
  transform: ViewportTransform;
  panBy: (dx: number, dy: number) => void;
  recordSnapshot: (nextElements?: CanvasElement[]) => void;
  setCreatingElement: (el: CanvasElement | null) => void;
  setMarqueeBox: (box: BoundingBox | null) => void;
  startEditingText?: (state: EditingTextState) => void;
  startEditingElement: (id: string) => void;
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
}

export interface CanvasToolHandler {
  onPointerDown: (
    ctx: ToolContext,
    screenPoint: Point,
    canvasPoint: Point,
    e: MouseEvent | TouchEvent,
  ) => void;
  onPointerMove: (
    ctx: ToolContext,
    screenPoint: Point,
    canvasPoint: Point,
    e: MouseEvent | TouchEvent,
  ) => void;
  onPointerUp: (
    ctx: ToolContext,
    screenPoint: Point,
    canvasPoint: Point,
    e: MouseEvent | TouchEvent,
  ) => void;
  onDoubleClick?: (
    ctx: ToolContext,
    screenPoint: Point,
    canvasPoint: Point,
    e: MouseEvent | TouchEvent,
  ) => void;
}
