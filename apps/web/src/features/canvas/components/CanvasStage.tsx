"use client";

import type Konva from "konva";
import * as React from "react";
import { Layer, Stage } from "react-konva";
import { CANVAS_THEME, getCanvasTheme } from "../constants/canvas-theme";
import { getToolHandler } from "../toolbar_tools/ToolManager";
import type { ToolContext } from "../toolbar_tools/types";
import type {
  BoundingBox,
  CanvasElement,
  CanvasStageProps as Props,
  TextElement,
} from "../types";
import { generateElementId, screenToCanvasPoint } from "../utils/helper";
import { CanvasShapeRenderer } from "./CanvasShapeRenderer";
import { CanvasTransformer } from "./CanvasTransformer";
import { SelectionMarquee } from "./SelectionMarquee";
import { ShapeFloatingToolbar } from "./ShapeFloatingToolbar";
import { TextEditorOverlay } from "./TextEditorOverlay";

export function CanvasStage({
  elements,
  selectedIds,
  activeTool,
  transform,
  editingElementId: controlledEditingId,
  onEditingElementIdChange,
  onElementsChange,
  onSelectElements,
  onSetActiveTool,
  onTransformChange,
  recordSnapshot,
  panBy,
  handleWheel: parentHandleWheel,
  theme = "light",
  onIsDrawingChange,
}: Props) {
  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [dimensions, setDimensions] = React.useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1000,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  }));
  const [creatingElement, setCreatingElement] = React.useState<CanvasElement | null>(null);
  const [marqueeBox, setMarqueeBox] = React.useState<BoundingBox | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = React.useState<string[]>([]);
  const [internalEditingId, setInternalEditingId] = React.useState<string | null>(null);

  const editingElementId = controlledEditingId !== undefined ? controlledEditingId : internalEditingId;
  const setEditingElementId = React.useCallback(
    (id: string | null) => {
      if (onEditingElementIdChange) {
        onEditingElementIdChange(id);
      } else {
        setInternalEditingId(id);
      }
    },
    [onEditingElementIdChange],
  );

  const stageRef = React.useRef<Konva.Stage>(null);
  const dragInitialPositionsRef = React.useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );

  React.useEffect(() => {
    const updateSize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  React.useEffect(() => {
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        stageRef.current?.batchDraw();
      });
    }
  }, []);

  const internalPanBy = React.useCallback(
    (dx: number, dy: number) => {
      if (panBy) {
        panBy(dx, dy);
      } else {
        onTransformChange({
          ...transform,
          x: transform.x + dx,
          y: transform.y + dy,
        });
      }
    },
    [panBy, onTransformChange, transform],
  );

  const setSelectedIds = React.useCallback(
    (action: React.SetStateAction<string[]>) => {
      if (typeof action === "function") {
        onSelectElements(action(selectedIds));
      } else {
        onSelectElements(action);
      }
    },
    [onSelectElements, selectedIds],
  );

  const setElementsAction = React.useCallback(
    (action: React.SetStateAction<CanvasElement[]>) => {
      if (typeof action === "function") {
        onElementsChange(action(elements));
      } else {
        onElementsChange(action);
      }
    },
    [onElementsChange, elements],
  );

  const toolContext = React.useMemo<ToolContext>(() => {
    return {
      elements,
      setElements: setElementsAction,
      selectedIds,
      setSelectedIds,
      pendingDeleteIds,
      setPendingDeleteIds,
      transform,
      panBy: internalPanBy,
      recordSnapshot,
      setCreatingElement,
      setMarqueeBox,
      startEditingElement: (id: string) => setEditingElementId(id),
      activeTool,
      setActiveTool: onSetActiveTool,
      theme,
    };
  }, [
    elements,
    setElementsAction,
    selectedIds,
    setSelectedIds,
    pendingDeleteIds,
    transform,
    internalPanBy,
    recordSnapshot,
    setEditingElementId,
    activeTool,
    onSetActiveTool,
    theme,
  ]);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointerPos = stage ? stage.getPointerPosition() : null;

    if (parentHandleWheel) {
      parentHandleWheel(
        e.evt.deltaX,
        e.evt.deltaY,
        e.evt.ctrlKey || e.evt.metaKey,
        pointerPos,
      );
    } else {
      if (e.evt.ctrlKey || e.evt.metaKey) {
        const factor = e.evt.deltaY < 0 ? 1.05 : 0.95;
        const nextScale = Math.min(
          Math.max(transform.scale * factor, CANVAS_THEME.zoom.min),
          CANVAS_THEME.zoom.max,
        );
        const center = pointerPos ?? {
          x: dimensions.width / 2,
          y: dimensions.height / 2,
        };
        const newX = center.x - (center.x - transform.x) * (nextScale / transform.scale);
        const newY = center.y - (center.y - transform.y) * (nextScale / transform.scale);
        onTransformChange({ x: newX, y: newY, scale: Number(nextScale.toFixed(3)) });
      } else {
        onTransformChange({
          ...transform,
          x: transform.x - e.evt.deltaX,
          y: transform.y - e.evt.deltaY,
        });
      }
    }
  };

  const handleStagePointerDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if ("button" in e.evt && e.evt.button !== 0) return;

    const stage = stageRef.current;
    if (!stage) return;

    const screenPos = stage.getPointerPosition();
    if (!screenPos) return;

    const canvasPos = screenToCanvasPoint(screenPos, transform);
    const isClickedOnBackground = e.target === stage;

    // If user clicked on transformer anchor or transformer handle, let transformer handle it
    let curr: Konva.Node | null = e.target;
    let isTransformerClick = false;
    while (curr) {
      if (
        curr.className === "Transformer" ||
        curr.name()?.includes("_anchor") ||
        curr.name()?.includes("_rotate-zone")
      ) {
        isTransformerClick = true;
        break;
      }
      curr = curr.getParent();
    }

    if (isTransformerClick) {
      return;
    }

    if (isClickedOnBackground && activeTool === "select") {
      const shiftKey = "shiftKey" in e.evt ? Boolean(e.evt.shiftKey) : false;
      if (!shiftKey) {
        onSelectElements([]);
      }
    }

    // Only run tool pointer down if clicked on background or if drawing/erasing tool
    if (isClickedOnBackground || activeTool !== "select") {
      if (activeTool !== "select" && activeTool !== "pan") {
        onIsDrawingChange?.(true);
      }
      const handler = getToolHandler(activeTool);
      handler.onPointerDown(toolContext, screenPos, canvasPos, e.evt);
    }
  };

  const handleStagePointerMove = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const stage = stageRef.current;
    if (!stage) return;

    const screenPos = stage.getPointerPosition();
    if (!screenPos) return;

    const canvasPos = screenToCanvasPoint(screenPos, transform);
    const handler = getToolHandler(activeTool);
    handler.onPointerMove(toolContext, screenPos, canvasPos, e.evt);
  };

  const handleStagePointerUp = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    onIsDrawingChange?.(false);
    const stage = stageRef.current;
    if (!stage) return;

    const screenPos = stage.getPointerPosition();
    if (!screenPos) return;

    const canvasPos = screenToCanvasPoint(screenPos, transform);
    const handler = getToolHandler(activeTool);
    handler.onPointerUp(toolContext, screenPos, canvasPos, e.evt);
  };

  const handleStageDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    if (e.target === stage) {
      const screenPos = stage.getPointerPosition();
      if (!screenPos) return;
      const canvasPos = screenToCanvasPoint(screenPos, transform);

      // Create new text element immediately at click
      const newText: TextElement = {
        type: "text",
        id: generateElementId("text"),
        x: canvasPos.x,
        y: canvasPos.y,
        text: "",
        fontSize: 24,
        fontFamily: CANVAS_THEME.fonts.canvas,
        stroke: getCanvasTheme(theme).defaultShape.stroke,
        strokeWidth: 1,
        fill: "transparent",
        opacity: 1,
      };

      const nextElements = [...elements, newText];
      onElementsChange(nextElements);
      onSelectElements([newText.id]);
      setEditingElementId(newText.id);
      onSetActiveTool("select");
    }
  };

  const handleShapeSelect = (id: string, shiftKey: boolean) => {
    if (activeTool !== "select") return;

    if (shiftKey) {
      onSelectElements(
        selectedIds.includes(id)
          ? selectedIds.filter((item) => item !== id)
          : [...selectedIds, id],
      );
    } else {
      if (!selectedIds.includes(id)) {
        onSelectElements([id]);
      }
    }
  };

  const handleShapeDragStart = (id: string) => {
    if (!selectedIds.includes(id)) {
      onSelectElements([id]);
    }

    const posMap = new Map<string, { x: number; y: number }>();
    const targets = selectedIds.includes(id) ? selectedIds : [id];
    elements.forEach((el) => {
      if (targets.includes(el.id)) {
        posMap.set(el.id, { x: el.x, y: el.y });
      }
    });
    dragInitialPositionsRef.current = posMap;
  };

  const handleShapeDragMove = (id: string, newX: number, newY: number) => {
    const initPos = dragInitialPositionsRef.current.get(id);
    if (!initPos) return;

    const dx = newX - initPos.x;
    const dy = newY - initPos.y;

    const nextElements = elements.map((item) => {
      const basePos = dragInitialPositionsRef.current.get(item.id);
      if (basePos && item.id !== id) {
        return { ...item, x: basePos.x + dx, y: basePos.y + dy };
      }
      if (item.id === id) {
        return { ...item, x: newX, y: newY };
      }
      return item;
    });

    onElementsChange(nextElements);
  };

  const handleShapeDragEnd = (id: string, newX: number, newY: number) => {
    const initPos = dragInitialPositionsRef.current.get(id);
    if (!initPos) {
      const nextElements = elements.map((item) =>
        item.id === id ? { ...item, x: newX, y: newY } : item,
      );
      onElementsChange(nextElements);
      recordSnapshot(nextElements);
      return;
    }

    const dx = newX - initPos.x;
    const dy = newY - initPos.y;

    const nextElements = elements.map((item) => {
      const basePos = dragInitialPositionsRef.current.get(item.id);
      if (basePos) {
        return { ...item, x: basePos.x + dx, y: basePos.y + dy };
      }
      return item;
    });

    dragInitialPositionsRef.current.clear();
    onElementsChange(nextElements);
    recordSnapshot(nextElements);
  };

  const handleShapeDoubleClick = (element: CanvasElement) => {
    setEditingElementId(element.id);
  };

  const handleTextChange = (text: string) => {
    if (!editingElementId) return;

    const nextElements = elements.map((el) => {
      if (el.id === editingElementId) {
        return { ...el, text };
      }
      return el;
    });

    onElementsChange(nextElements);
  };

  const handleTextFinish = () => {
    if (!editingElementId) return;

    const targetEl = elements.find((el) => el.id === editingElementId);
    if (targetEl && targetEl.type === "text" && !targetEl.text?.trim()) {
      // Remove empty standalone text element
      const nextElements = elements.filter((el) => el.id !== editingElementId);
      onElementsChange(nextElements);
      recordSnapshot(nextElements);
      onSelectElements([]);
    } else {
      recordSnapshot(elements);
    }

    setEditingElementId(null);
  };

  const editingElement = elements.find((el) => el.id === editingElementId) ?? null;

  const selectedShapeElement = React.useMemo(() => {
    if (editingElement) {
      return editingElement;
    }
    if (selectedIds.length === 1) {
      return elements.find((item) => item.id === selectedIds[0]) ?? null;
    }
    return null;
  }, [editingElement, selectedIds, elements]);

  const handleUpdateElement = React.useCallback(
    (updated: CanvasElement) => {
      const nextElements = elements.map((el) =>
        el.id === updated.id ? updated : el,
      );
      onElementsChange(nextElements);
      recordSnapshot(nextElements);
    },
    [elements, onElementsChange, recordSnapshot],
  );

  const handleDuplicateElement = React.useCallback(
    (el: CanvasElement) => {
      const newId = generateElementId(el.type);
      const offset = 24;
      const duplicated = {
        ...el,
        id: newId,
        x: el.x + offset,
        y: el.y + offset,
      };
      const nextElements = [...elements, duplicated];
      onElementsChange(nextElements);
      recordSnapshot(nextElements);
      onSelectElements([newId]);
    },
    [elements, onElementsChange, recordSnapshot, onSelectElements],
  );

  const handleDeleteElement = React.useCallback(
    (id: string) => {
      const nextElements = elements.filter((el) => el.id !== id);
      onElementsChange(nextElements);
      recordSnapshot(nextElements);
      onSelectElements([]);
      if (editingElementId === id) {
        setEditingElementId(null);
      }
    },
    [
      elements,
      onElementsChange,
      recordSnapshot,
      onSelectElements,
      editingElementId,
      setEditingElementId,
    ],
  );

  if (!isMounted) {
    return (
      <div
        className="size-full bg-[radial-gradient(var(--primary)_1px,transparent_1px)] bg-size-[24px_24px] opacity-70"
        aria-hidden="true"
      />
    );
  }

  const cursorClass =
    activeTool === "pan"
      ? "cursor-grab active:cursor-grabbing"
      : activeTool === "eraser" ||
          activeTool === "rectangle" ||
          activeTool === "diamond" ||
          activeTool === "ellipse" ||
          activeTool === "line" ||
          activeTool === "arrow" ||
          activeTool === "pen" ||
          activeTool === "sticky" ||
          activeTool === "text" ||
          activeTool === "image"
        ? "cursor-crosshair"
        : "cursor-default";

  return (
    <div className={`relative h-full w-full select-none ${cursorClass}`}>
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={transform.x}
        y={transform.y}
        scaleX={transform.scale}
        scaleY={transform.scale}
        onWheel={handleWheel}
        onMouseDown={handleStagePointerDown}
        onMouseMove={handleStagePointerMove}
        onMouseUp={handleStagePointerUp}
        onTouchStart={handleStagePointerDown}
        onTouchMove={handleStagePointerMove}
        onTouchEnd={handleStagePointerUp}
        onDblClick={handleStageDoubleClick}
      >
        <Layer>
          {/* Render Elements */}
          {elements.map((el) => (
            <CanvasShapeRenderer
              key={el.id}
              element={el}
              isSelected={selectedIds.includes(el.id)}
              isDraggable={activeTool === "select" && !editingElementId}
              isPendingDelete={pendingDeleteIds.includes(el.id)}
              isEditing={editingElementId === el.id}
              theme={theme}
              onDragStart={handleShapeDragStart}
              onDragMove={handleShapeDragMove}
              onDragEnd={handleShapeDragEnd}
              onSelect={handleShapeSelect}
              onDoubleClick={handleShapeDoubleClick}
            />
          ))}

          {/* Active Tool Creation Preview */}
          {creatingElement ? (
            <CanvasShapeRenderer
              element={creatingElement}
              isSelected={false}
              isDraggable={false}
              theme={theme}
              onDragEnd={() => {}}
              onSelect={() => {}}
              onDoubleClick={() => {}}
            />
          ) : null}

          {/* Selection Marquee */}
          <SelectionMarquee marqueeBox={marqueeBox} theme={theme} />

          {/* Transformer (only when NOT editing text) */}
          {activeTool === "select" && !editingElementId ? (
            <CanvasTransformer
              selectedIds={selectedIds}
              elements={elements}
              onElementsChange={onElementsChange}
              recordSnapshot={recordSnapshot}
              theme={theme}
            />
          ) : null}
        </Layer>
      </Stage>

      {/* Seamless Real-time Inline Text Editor Overlay */}
      <TextEditorOverlay
        key={editingElement?.id ?? "none"}
        element={editingElement}
        transform={transform}
        theme={theme}
        onChangeText={handleTextChange}
        onFinish={handleTextFinish}
      />

      {/* Floating Shape Options Toolbar */}
      {selectedShapeElement ? (
        <ShapeFloatingToolbar
          element={selectedShapeElement}
          transform={transform}
          theme={theme}
          onUpdateElement={handleUpdateElement}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
        />
      ) : null}
    </div>
  );
}
