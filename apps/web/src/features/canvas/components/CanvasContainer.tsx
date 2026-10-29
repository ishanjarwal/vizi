"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/shared/lib/utils";
import { DEFAULT_ACTIVE_TOOL } from "../constants";
import { useCanvasHistory } from "../hooks/useCanvasHistory";
import { useCanvasTransform } from "../hooks/useCanvasTransform";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useCollaboration } from "../hooks/useCollaboration";
import { promptImageFile, setPendingImage } from "../toolbar_tools/ImageTool";
import { getCanvasBgColor, getCanvasTheme } from "../constants/canvas-theme";
import type {
  CanvasContainerProps as Props,
  CanvasDrawingStyles,
  CanvasElement,
  Point,
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
import { UserCursorsOverlay } from "./UserCursorsOverlay";
import { CollaborateModal } from "./CollaborateModal";

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

  // Baseline map of elements last broadcast to or received from the room
  const synchronizedElementsRef = React.useRef<Map<string, CanvasElement>>(
    new Map(initialElements.map((el) => [el.id, { ...el }])),
  );

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

  // Canvas Settings (Background color, Dotted grid, Export options)
  const [canvasBgId, setCanvasBgId] = React.useState<string>(() => {
    if (typeof window === "undefined") return "default";
    try {
      return localStorage.getItem("vizi_canvas_bg_id") || "default";
    } catch {
      return "default";
    }
  });

  const [isDotted, setIsDotted] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem("vizi_canvas_dotted");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const [includeBgOnExport, setIncludeBgOnExport] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem("vizi_export_bg");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const canvasBgColor = getCanvasBgColor(canvasBgId, currentTheme);

  const handleChangeCanvasBg = React.useCallback((id: string) => {
    setCanvasBgId(id);
    try {
      localStorage.setItem("vizi_canvas_bg_id", id);
    } catch {
      // ignore
    }
  }, []);

  const handleToggleDotted = React.useCallback((checked: boolean) => {
    setIsDotted(checked);
    try {
      localStorage.setItem("vizi_canvas_dotted", String(checked));
    } catch {
      // ignore
    }
  }, []);

  const handleToggleIncludeBgOnExport = React.useCallback((checked: boolean) => {
    setIncludeBgOnExport(checked);
    try {
      localStorage.setItem("vizi_export_bg", String(checked));
    } catch {
      // ignore
    }
  }, []);

  // Real-time Collaboration Hook
  const {
    roomId,
    isConnected,
    isConnecting,
    peers,
    selfUser,
    isModalOpen,
    setIsModalOpen,
    shareUrl,
    createRoom,
    broadcastCursor,
    broadcastElementCreate,
    broadcastElementUpdate,
    broadcastElementDelete,
  } = useCollaboration({
    onRemoteElementsLoaded: (loaded) => {
      clearHistory(loaded);
      synchronizedElementsRef.current = new Map(
        loaded.map((el) => [el.id, { ...el }]),
      );
    },
    onRemoteElementsCreated: (newEls) => {
      for (const el of newEls) {
        synchronizedElementsRef.current.set(el.id, { ...el });
      }
      setElements((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const filteredNew = newEls.filter((e) => !existingIds.has(e.id));
        return [...prev, ...filteredNew];
      });
    },
    onRemoteElementsUpdated: (updatedEls) => {
      for (const el of updatedEls) {
        synchronizedElementsRef.current.set(el.id, { ...el });
      }
      setElements((prev) => {
        const updateMap = new Map(updatedEls.map((e) => [e.id, e]));
        return prev.map((el) => updateMap.get(el.id) ?? el);
      });
    },
    onRemoteElementsDeleted: (deletedIds) => {
      for (const id of deletedIds) {
        synchronizedElementsRef.current.delete(id);
      }
      const deleteSet = new Set(deletedIds);
      setElements((prev) => prev.filter((el) => !deleteSet.has(el.id)));
    },
    onLocalElementsSync: () => {
      // Creator had existing elements before creating room; sync them into the new room
      if (elements.length > 0) {
        broadcastElementCreate(elements);
        synchronizedElementsRef.current = new Map(
          elements.map((el) => [el.id, { ...el }]),
        );
      }
    },
  });

  const handleRecordSnapshot = React.useCallback(
    (nextElements?: CanvasElement[]) => {
      const target = nextElements ?? elements;
      recordSnapshot(target);

      if (roomId) {
        const syncMap = synchronizedElementsRef.current;
        const nextMap = new Map(target.map((el) => [el.id, el]));

        const added: CanvasElement[] = [];
        const updated: CanvasElement[] = [];
        const deletedIds: string[] = [];

        // Check for created or updated elements
        for (const [id, nextEl] of nextMap.entries()) {
          const prevEl = syncMap.get(id);
          if (!prevEl) {
            added.push(nextEl);
          } else {
            // Check position, dimensions, rotation, styling, points, text
            const hasChanged =
              prevEl.x !== nextEl.x ||
              prevEl.y !== nextEl.y ||
              prevEl.width !== nextEl.width ||
              prevEl.height !== nextEl.height ||
              prevEl.rotation !== nextEl.rotation ||
              prevEl.stroke !== nextEl.stroke ||
              prevEl.fill !== nextEl.fill ||
              prevEl.strokeWidth !== nextEl.strokeWidth ||
              prevEl.opacity !== nextEl.opacity ||
              prevEl.text !== nextEl.text ||
              (prevEl as { radiusX?: number }).radiusX !==
                (nextEl as { radiusX?: number }).radiusX ||
              (prevEl as { radiusY?: number }).radiusY !==
                (nextEl as { radiusY?: number }).radiusY ||
              JSON.stringify((prevEl as { points?: number[] }).points) !==
                JSON.stringify((nextEl as { points?: number[] }).points);

            if (hasChanged) {
              updated.push(nextEl);
            }
          }
        }

        // Check for deleted elements
        for (const id of syncMap.keys()) {
          if (!nextMap.has(id)) {
            deletedIds.push(id);
          }
        }

        // Update local syncMap baseline to target
        synchronizedElementsRef.current = new Map(
          target.map((el) => [el.id, { ...el }]),
        );

        if (added.length > 0) broadcastElementCreate(added);
        if (updated.length > 0) broadcastElementUpdate(updated);
        if (deletedIds.length > 0) broadcastElementDelete(deletedIds);
      }
    },
    [
      elements,
      recordSnapshot,
      roomId,
      broadcastElementCreate,
      broadcastElementUpdate,
      broadcastElementDelete,
    ],
  );

  const handlePointerMoveCanvas = React.useCallback(
    (point: Point) => {
      if (isConnected && roomId) {
        broadcastCursor(point.x, point.y, isDrawing);
      }
    },
    [isConnected, roomId, broadcastCursor, isDrawing],
  );

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
      handleRecordSnapshot(remaining);
      return remaining;
    });
    setSelectedIds([]);
  }, [selectedIds, editingElementId, setElements, handleRecordSnapshot]);

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
          handleRecordSnapshot(updated);
          return updated;
        });
      }
    },
    [selectedIds, setElements, handleRecordSnapshot],
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
    if (roomId && elements.length > 0) {
      synchronizedElementsRef.current.clear();
      broadcastElementDelete(elements.map((e) => e.id));
    }
  }, [clearHistory, resetZoom, roomId, elements, broadcastElementDelete]);

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
      if (roomId) {
        synchronizedElementsRef.current = new Map(
          importedElements.map((el) => [el.id, { ...el }]),
        );
        broadcastElementCreate(importedElements);
      }
    },
    [clearHistory, roomId, broadcastElementCreate],
  );

  const handleExportImage = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const canvasElement = document.querySelector(
      ".konvajs-content canvas",
    ) as HTMLCanvasElement | null;
    if (!canvasElement) return;

    if (!includeBgOnExport) {
      // Export transparent background PNG
      const dataUrl = canvasElement.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `vizi-whiteboard-${Date.now()}.png`;
      link.click();
      return;
    }

    // Export composite with background color (and dots if enabled)
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvasElement.width;
    exportCanvas.height = canvasElement.height;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // 1. Fill canvas background color
    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // 2. Draw dotted grid pattern if active
    if (isDotted) {
      const viewWidth = canvasElement.clientWidth || window.innerWidth;
      const viewHeight = canvasElement.clientHeight || window.innerHeight;
      const pixelRatio = viewWidth > 0 ? canvasElement.width / viewWidth : 1;

      ctx.save();
      ctx.scale(pixelRatio, pixelRatio);
      ctx.fillStyle =
        currentTheme === "dark"
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(30, 41, 59, 0.15)";
      const step = 20 * transform.scale;
      const startX = ((transform.x % step) + step) % step;
      const startY = ((transform.y % step) + step) % step;
      const dotRadius = Math.max(1, 1.2 * transform.scale);

      for (let x = startX; x < viewWidth; x += step) {
        for (let y = startY; y < viewHeight; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 3. Draw Konva canvas layer over background
    ctx.drawImage(canvasElement, 0, 0);

    const dataUrl = exportCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `vizi-whiteboard-${Date.now()}.png`;
    link.click();
  }, [includeBgOnExport, canvasBgColor, isDotted, currentTheme, transform]);

  const handleOpenCollaborate = React.useCallback(() => {
    if (roomId) {
      setIsModalOpen(true);
    } else {
      void createRoom();
    }
  }, [roomId, setIsModalOpen, createRoom]);

  return (
    <div
      className={cn(
        "relative flex h-screen w-screen overflow-hidden",
        className,
      )}
      style={{ backgroundColor: canvasBgColor }}
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
      <TopRightMenu
        onCollaborate={handleOpenCollaborate}
        peerCount={peers.length}
        isConnected={isConnected}
        roomId={roomId}
      />

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
        isDotted={isDotted}
        onToggleDotted={handleToggleDotted}
        canvasBgId={canvasBgId}
        onChangeCanvasBg={handleChangeCanvasBg}
        includeBgOnExport={includeBgOnExport}
        onToggleIncludeBgOnExport={handleToggleIncludeBgOnExport}
      />

      {/* Dotted Grid and Background Layer */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-colors duration-200"
        style={{
          backgroundColor: canvasBgColor,
          backgroundImage: isDotted
            ? `radial-gradient(circle, ${
                currentTheme === "dark"
                  ? "rgba(255, 255, 255, 0.15)"
                  : "rgba(30, 41, 59, 0.15)"
              } ${Math.max(1, 1.2 * transform.scale)}px, transparent ${Math.max(1, 1.2 * transform.scale)}px)`
            : "none",
          backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`,
        }}
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
          recordSnapshot={handleRecordSnapshot}
          panBy={panBy}
          handleWheel={handleWheel}
          theme={currentTheme}
          onIsDrawingChange={setIsDrawing}
          onPointerMoveCanvas={handlePointerMoveCanvas}
        />
      </div>

      {/* Multiplayer Moving Cursors Overlay */}
      <UserCursorsOverlay
        peers={peers}
        transform={transform}
        currentUserId={selfUser?.id}
      />

      {/* Collaboration Dialog */}
      <CollaborateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roomId={roomId}
        shareUrl={shareUrl}
        peers={peers}
        selfUser={selfUser}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onCreateRoom={createRoom}
      />
    </div>
  );
}
