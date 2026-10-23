import type { LucideIcon } from "lucide-react";

export type ToolType =
  | "select"
  | "pan"
  | "eraser"
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "line"
  | "arrow"
  | "pen"
  | "sticky"
  | "text"
  | "image";

export type CanvasToolId = ToolType;

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

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
}

export interface BaseElementProps {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  stroke: string;
  strokeWidth: number;
  fill: string;
  opacity: number;
  cornerRadius?: number;
  isPendingDelete?: boolean;
  text?: string;
}

export interface RectangleElement extends BaseElementProps {
  type: "rectangle";
  width: number;
  height: number;
}

export interface EllipseElement extends BaseElementProps {
  type: "ellipse";
  radiusX: number;
  radiusY: number;
}

export interface DiamondElement extends BaseElementProps {
  type: "diamond";
  width: number;
  height: number;
}

export interface LineElement extends BaseElementProps {
  type: "line";
  points: number[];
}

export interface ArrowElement extends BaseElementProps {
  type: "arrow";
  points: number[];
}

export interface StickyElement extends BaseElementProps {
  type: "sticky";
  width: number;
  height: number;
  colorScheme: string;
}

export interface TextElement extends BaseElementProps {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  width?: number;
  height?: number;
}

export interface ImageElement extends BaseElementProps {
  type: "image";
  src: string;
  aspectRatio: number;
  width: number;
  height: number;
}

export interface PenElement extends BaseElementProps {
  type: "pen";
  points: number[];
}

export type CanvasElement =
  | RectangleElement
  | EllipseElement
  | DiamondElement
  | LineElement
  | ArrowElement
  | StickyElement
  | TextElement
  | ImageElement
  | PenElement;

export interface EditingTextState {
  elementId?: string;
  isNew: boolean;
  x: number;
  y: number;
  width?: number;
  height?: number;
  initialText: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  shapeType?: CanvasElement["type"];
}

// Component Props Contracts
export interface ToolbarProps {
  className?: string;
  activeToolId?: CanvasToolId;
  onSelectTool?: (tool: CanvasToolId) => void;
}

export interface TopMenuProps {
  className?: string;
  onResetCanvas?: () => void;
  onExportJson?: () => void;
  onImportJson?: (data: CanvasElement[]) => void;
  onExportImage?: () => void;
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
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export interface EmptyCardProps {
  className?: string;
  isVisible?: boolean;
}

export interface CanvasStageProps {
  elements: CanvasElement[];
  selectedIds: string[];
  activeTool: ToolType;
  transform: ViewportTransform;
  editingElementId?: string | null;
  onEditingElementIdChange?: (id: string | null) => void;
  onElementsChange: (elements: CanvasElement[]) => void;
  onSelectElements: (ids: string[]) => void;
  onSetActiveTool: (tool: ToolType) => void;
  onTransformChange: (transform: ViewportTransform) => void;
  recordSnapshot: (nextElements?: CanvasElement[]) => void;
  panBy?: (dx: number, dy: number) => void;
  handleWheel?: (
    deltaX: number,
    deltaY: number,
    ctrlKey: boolean,
    pointerPos: Point | null,
  ) => void;
}

export interface CanvasTransformerProps {
  selectedIds: string[];
  elements: CanvasElement[];
  onElementsChange: (elements: CanvasElement[]) => void;
  recordSnapshot: (nextElements?: CanvasElement[]) => void;
}

export interface TextEditorOverlayProps {
  element: CanvasElement | null;
  transform: ViewportTransform;
  onChangeText: (text: string) => void;
  onFinish: () => void;
}

export interface StickyColorPaletteProps {
  element: StickyElement;
  transform: ViewportTransform;
  onColorChange: (color: string) => void;
}

export interface ShapeFloatingToolbarProps {
  element: CanvasElement;
  transform: ViewportTransform;
  onUpdateElement: (updated: CanvasElement) => void;
  onDuplicateElement: (element: CanvasElement) => void;
  onDeleteElement: (id: string) => void;
}

export interface SelectionMarqueeProps {
  marqueeBox: BoundingBox | null;
}

export interface CanvasShapeRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  isDraggable: boolean;
  isPendingDelete?: boolean;
  isEditing?: boolean;
  onDragStart?: (id: string, x: number, y: number) => void;
  onDragMove?: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDoubleClick: (element: CanvasElement) => void;
}

export interface ToolManagerProps {
  children?: React.ReactNode;
}

export interface CanvasContainerProps {
  className?: string;
  initialElements?: CanvasElement[];
}
