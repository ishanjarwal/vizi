"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/shared/lib/utils";
import { DEFAULT_ACTIVE_TOOL } from "../constants";
import { useCanvasHistory } from "../hooks/useCanvasHistory";
import { useCanvasTransform } from "../hooks/useCanvasTransform";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { promptImageFile, setPendingImage } from "../toolbar_tools/ImageTool";
import { getCanvasTheme } from "../constants/canvas-theme";
import type {
  CanvasContainerProps as Props,
  CanvasDrawingStyles,
  CanvasElement,
  ToolType,
} from "../types";
import { convertElementTheme, convertFillColor, convertStrokeColor } from "../utils";
import { BottomLeftOptions } from "./BottomLeftOptions";
import { CanvasOptionsPanel } from "./CanvasOptionsPanel";
import { CanvasStage } from "./CanvasStage";
import { EmptyCard } from "./EmptyCard";
import { Toolbar } from "./Toolbar";
import { TopLeftMenu } from "./TopLeftMenu";
import { TopRightMenu } from "./TopRightMenu";

export function CanvasContainer({ className, initialElements = [] }: Props) {
  const {
    elements,
    setElements,
    undo,
    redo,
    canUndo,
    canRedo,
    recordSnapshot,
    clearHistory,
    mapHistoryElements,
  } = useCanvasHistory(initialElements);

  const {
    transform,
    setTransform,
    handleWheel,
    panBy,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useCanvasTransform();

  const { resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const currentTheme: "light" | "dark" =
    mounted && resolvedTheme === "dark" ? "dark" : "light";
  const prevThemeRef = React.useRef<"light" | "dark">(currentTheme);

  const [drawingStyles, setDrawingStyles] = React.useState<CanvasDrawingStyles>(() => {
    const config = getCanvasTheme(currentTheme);
    return {
      stroke: config.defaultShape.stroke,
      fill: config.defaultShape.fill,
      strokeWidth: config.defaultShape.strokeWidth,
    };
  });

  React.useEffect(() => {
    if (!mounted) return;
    if (prevThemeRef.current !== currentTheme) {
      prevThemeRef.current = currentTheme;
      mapHistoryElements((el) => convertElementTheme(el, currentTheme));
      setDrawingStyles((prev) => ({
        ...prev,
        stroke: convertStrokeColor(prev.stroke, currentTheme),
        fill: convertFillColor(prev.fill, currentTheme),
      }));
    }
  }, [currentTheme, mounted, mapHistoryElements]);

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [activeTool, setActiveTool] = React.useState<ToolType>(DEFAULT_ACTIVE_TOOL);
  const [editingElementId, setEditingElementId] = React.useState<string | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  const handleSelectTool = React.useCallback(
    (tool: ToolType) => {
      if (tool === "image") {
        promptImageFile({
          onLoaded: () => {
            setActiveTool("image");
            setSelectedIds([]);
          },
          onCancel: () => {
            if (activeTool === "image") {
              setActiveTool("select");
            }
          },
        });
        return;
      }

      if (activeTool === "image") {
        setPendingImage(null);
      }

      setActiveTool(tool);
      if (tool !== "select") {
        setSelectedIds([]);
      }
    },
    [activeTool],
  );

  const deleteSelected = React.useCallback(() => {
    if (selectedIds.length === 0 || editingElementId) return;
    setElements((prev) => {
      const remaining = prev.filter((el) => !selectedIds.includes(el.id));
      recordSnapshot(remaining);
      return remaining;
    });
    setSelectedIds([]);
  }, [selectedIds, editingElementId, setElements, recordSnapshot]);

  const handleChangeDrawingStyles = React.useCallback(
    (newStyles: CanvasDrawingStyles) => {
      setDrawingStyles(newStyles);
      if (selectedIds.length > 0) {
        setElements((prev) => {
          const updated = prev.map((el) => {
            if (!selectedIds.includes(el.id)) return el;
            const updates: Partial<CanvasElement> = {};
            if ("stroke" in el) updates.stroke = newStyles.stroke;
            if (
              "fill" in el &&
              el.type !== "sticky" &&
              el.type !== "pen" &&
              el.type !== "line"
            ) {
              updates.fill = newStyles.fill;
            }
            if ("strokeWidth" in el) updates.strokeWidth = newStyles.strokeWidth;
            return { ...el, ...updates } as CanvasElement;
          });
          recordSnapshot(updated);
          return updated;
        });
      }
    },
    [selectedIds, setElements, recordSnapshot],
  );

  useKeyboardShortcuts({
    activeTool,
    setActiveTool: handleSelectTool,
    deleteSelected,
    undo,
    redo,
    canUndo,
    canRedo,
    isEditingText: Boolean(editingElementId),
  });

  const handleResetCanvas = React.useCallback(() => {
    clearHistory([]);
    setSelectedIds([]);
    setEditingElementId(null);
    resetZoom();
  }, [clearHistory, resetZoom]);

  const handleExportJson = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const jsonStr = JSON.stringify(elements, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vizi-canvas-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [elements]);

  const handleImportJson = React.useCallback(
    (importedElements: CanvasElement[]) => {
      clearHistory(importedElements);
      setSelectedIds([]);
      setEditingElementId(null);
    },
    [clearHistory],
  );

  const handleExportImage = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const canvasElement = document.querySelector(".konvajs-content canvas") as HTMLCanvasElement | null;
    if (!canvasElement) return;

    const dataUrl = canvasElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `vizi-whiteboard-${Date.now()}.png`;
    link.click();
  }, []);

  return (
    <div
      className={cn(
        "relative flex h-screen w-screen overflow-hidden bg-background",
        className,
      )}
    >
      {/* Top Left Menu */}
      <TopLeftMenu
        onResetCanvas={handleResetCanvas}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onExportImage={handleExportImage}
      />

      {/* Top Centered Header Toolbar */}
      <Toolbar
        activeToolId={activeTool}
        onSelectTool={handleSelectTool}
      />

      {/* Top Right Menu */}
      <TopRightMenu />

      {/* Center Empty Canvas State Card */}
      <EmptyCard isVisible={elements.length === 0 && !isDrawing} />

      {/* Bottom Left Controls */}
      <BottomLeftOptions
        zoom={Math.round(transform.scale * 100)}
        canUndo={canUndo}
        canRedo={canRedo}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onResetZoom={resetZoom}
        onUndo={undo}
        onRedo={redo}
      />

      {/* Middle Left Drawing Style Options Panel */}
      <CanvasOptionsPanel
        styles={drawingStyles}
        onChangeStyles={handleChangeDrawingStyles}
        theme={currentTheme}
      />

      {/* Canvas Konva Stage */}
      <div className="absolute inset-0 z-0">
        <CanvasStage
          elements={elements}
          selectedIds={selectedIds}
          activeTool={activeTool}
          transform={transform}
          drawingStyles={drawingStyles}
          editingElementId={editingElementId}
          onEditingElementIdChange={setEditingElementId}
          onElementsChange={setElements}
          onSelectElements={setSelectedIds}
          onSetActiveTool={handleSelectTool}
          onTransformChange={setTransform}
          recordSnapshot={recordSnapshot}
          panBy={panBy}
          handleWheel={handleWheel}
          theme={currentTheme}
          onIsDrawingChange={setIsDrawing}
        />
      </div>
    </div>
  );
}
