"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/shared/lib/utils";
import { DEFAULT_ACTIVE_TOOL } from "../constants";
import { useCanvasHistory } from "../hooks/useCanvasHistory";
import { useCanvasTransform } from "../hooks/useCanvasTransform";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import type {
  CanvasContainerProps as Props,
  CanvasElement,
  ToolType,
} from "../types";
import { convertElementTheme } from "../utils";
import { BottomLeftOptions } from "./BottomLeftOptions";
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

  React.useEffect(() => {
    if (!mounted) return;
    if (prevThemeRef.current !== currentTheme) {
      prevThemeRef.current = currentTheme;
      mapHistoryElements((el) => convertElementTheme(el, currentTheme));
    }
  }, [currentTheme, mounted, mapHistoryElements]);

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [activeTool, setActiveTool] = React.useState<ToolType>(DEFAULT_ACTIVE_TOOL);
  const [editingElementId, setEditingElementId] = React.useState<string | null>(null);

  const handleSelectTool = React.useCallback((tool: ToolType) => {
    setActiveTool(tool);
    if (tool !== "select") {
      setSelectedIds([]);
    }
  }, []);

  const deleteSelected = React.useCallback(() => {
    if (selectedIds.length === 0 || editingElementId) return;
    setElements((prev) => {
      const remaining = prev.filter((el) => !selectedIds.includes(el.id));
      recordSnapshot(remaining);
      return remaining;
    });
    setSelectedIds([]);
  }, [selectedIds, editingElementId, setElements, recordSnapshot]);

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
      <EmptyCard isVisible={elements.length === 0} />

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

      {/* Canvas Konva Stage */}
      <div className="absolute inset-0 z-0">
        <CanvasStage
          elements={elements}
          selectedIds={selectedIds}
          activeTool={activeTool}
          transform={transform}
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
        />
      </div>
    </div>
  );
}
