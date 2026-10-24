"use client";

import type Konva from "konva";
import * as React from "react";
import { Circle, Group, Transformer } from "react-konva";
import { getCanvasTheme } from "../constants/canvas-theme";
import type {
  ArrowElement,
  CanvasTransformerProps as Props,
  LineElement,
} from "../types";

function snapTo45Degrees(dx: number, dy: number): { dx: number; dy: number } {
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const step = Math.PI / 4; // 45 degrees
  const snappedAngle = Math.round(angle / step) * step;
  return {
    dx: Math.round(length * Math.cos(snappedAngle)),
    dy: Math.round(length * Math.sin(snappedAngle)),
  };
}

export function CanvasTransformer({
  selectedIds,
  elements,
  onElementsChange,
  recordSnapshot,
  theme = "light",
}: Props) {
  const trRef = React.useRef<Konva.Transformer>(null);
  const themeConfig = getCanvasTheme(theme);
  const isShiftPressedRef = React.useRef(false);
  const [isShiftPressed, setIsShiftPressed] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        isShiftPressedRef.current = true;
        setIsShiftPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        isShiftPressedRef.current = false;
        setIsShiftPressed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const selectedElements = React.useMemo(() => {
    return elements.filter((el) => selectedIds.includes(el.id));
  }, [elements, selectedIds]);

  const isSingleLineOrArrow = React.useMemo(() => {
    return (
      selectedElements.length === 1 &&
      (selectedElements[0].type === "line" || selectedElements[0].type === "arrow")
    );
  }, [selectedElements]);

  const isTextOnly = React.useMemo(() => {
    return (
      selectedElements.length > 0 &&
      selectedElements.every((el) => el.type === "text")
    );
  }, [selectedElements]);

  const hasTextOrImage = React.useMemo(() => {
    if (selectedElements.length === 0) return false;
    return selectedElements.some(
      (el) => el.type === "text" || el.type === "image",
    );
  }, [selectedElements]);

  React.useEffect(() => {
    if (!trRef.current) return;

    if (isSingleLineOrArrow || selectedElements.length === 0) {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
      return;
    }

    const stage = trRef.current.getStage();
    if (!stage) return;

    const nodes = selectedIds
      .map((id) => stage.findOne("#" + id))
      .filter((node): node is Konva.Node => Boolean(node));

    trRef.current.nodes(nodes);
    trRef.current.forceUpdate();
    trRef.current.getLayer()?.batchDraw();
  }, [selectedIds, selectedElements, isSingleLineOrArrow, elements]);

  const handleTransformEnd = React.useCallback(() => {
    if (!trRef.current) return;
    const stage = trRef.current.getStage();
    if (!stage) return;

    let hasChanges = false;
    const nextElements = elements.map((el) => {
      if (!selectedIds.includes(el.id)) return el;

      const node = stage.findOne("#" + el.id);
      if (!node) return el;

      hasChanges = true;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = Number(node.rotation().toFixed(1));
      const x = Number(node.x().toFixed(1));
      const y = Number(node.y().toFixed(1));

      // Reset internal scale on Konva node
      node.scaleX(1);
      node.scaleY(1);

      switch (el.type) {
        case "rectangle":
        case "diamond":
        case "sticky": {
          const width = Math.max(8, Number((el.width * Math.abs(scaleX)).toFixed(1)));
          const height = Math.max(8, Number((el.height * Math.abs(scaleY)).toFixed(1)));
          return { ...el, x, y, width, height, rotation };
        }
        case "ellipse": {
          const radiusX = Math.max(4, Number((el.radiusX * Math.abs(scaleX)).toFixed(1)));
          const radiusY = Math.max(4, Number((el.radiusY * Math.abs(scaleY)).toFixed(1)));
          return { ...el, x, y, radiusX, radiusY, rotation };
        }
        case "text": {
          const scale = Math.max(Math.abs(scaleX), Math.abs(scaleY));
          const currentFontSize = el.fontSize || 24;
          const newFontSize = Math.max(10, Math.round(currentFontSize * scale));

          const konvaText = node as Konva.Text;
          if (typeof konvaText.fontSize === "function") {
            konvaText.fontSize(newFontSize);
          }
          if (typeof konvaText.setAttr === "function") {
            konvaText.setAttr("width", undefined);
          }

          return { ...el, x, y, fontSize: newFontSize, rotation };
        }
        case "image": {
          const scale = Math.max(Math.abs(scaleX), Math.abs(scaleY));
          const width = Math.max(20, Number((el.width * scale).toFixed(1)));
          const height = Number((width / el.aspectRatio).toFixed(1));
          return { ...el, x, y, width, height, rotation };
        }
        case "line":
        case "arrow":
        case "pen": {
          const scaledPoints = el.points.map((pt, index) =>
            Number((pt * (index % 2 === 0 ? scaleX : scaleY)).toFixed(1)),
          );
          return { ...el, x, y, points: scaledPoints, rotation };
        }
        default:
          return el;
      }
    });

    if (hasChanges) {
      onElementsChange(nextElements);
      recordSnapshot(nextElements);
      trRef.current?.forceUpdate();
      trRef.current?.getLayer()?.batchDraw();
    }
  }, [elements, selectedIds, onElementsChange, recordSnapshot]);

  // Line / Arrow endpoint handles
  if (isSingleLineOrArrow) {
    const lineElement = selectedElements[0] as LineElement | ArrowElement;
    const pts = lineElement.points;
    if (pts.length >= 4) {
      const rot = lineElement.rotation || 0;
      let x1 = pts[0];
      let y1 = pts[1];
      let x2 = pts[2];
      let y2 = pts[3];
      if (rot !== 0) {
        const rad = (rot * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const rx1 = x1 * cos - y1 * sin;
        const ry1 = x1 * sin + y1 * cos;
        const rx2 = x2 * cos - y2 * sin;
        const ry2 = x2 * sin + y2 * cos;
        x1 = rx1;
        y1 = ry1;
        x2 = rx2;
        y2 = ry2;
      }
      const p1 = { x: lineElement.x + x1, y: lineElement.y + y1 };
      const p2 = { x: lineElement.x + x2, y: lineElement.y + y2 };

      return (
        <Group>
          {/* Start Anchor */}
          <Circle
            name="_anchor"
            x={p1.x}
            y={p1.y}
            radius={themeConfig.transformer.anchorSize / 2}
            fill={themeConfig.transformer.anchorFill}
            stroke={themeConfig.transformer.anchorStroke}
            strokeWidth={1.5}
            draggable
            dragBoundFunc={(pos) => {
              const isShift = isShiftPressedRef.current;
              if (!isShift) return pos;
              const { dx, dy } = snapTo45Degrees(pos.x - p2.x, pos.y - p2.y);
              return { x: p2.x + dx, y: p2.y + dy };
            }}
            onDragMove={(e) => {
              let targetX = e.target.x();
              let targetY = e.target.y();
              const isShift = Boolean(e.evt?.shiftKey) || isShiftPressedRef.current;
              if (isShift) {
                const { dx, dy } = snapTo45Degrees(targetX - p2.x, targetY - p2.y);
                targetX = p2.x + dx;
                targetY = p2.y + dy;
              }
              const newPts = [
                targetX - lineElement.x,
                targetY - lineElement.y,
                x2,
                y2,
              ];
              const updated = elements.map((item) =>
                item.id === lineElement.id
                  ? { ...item, points: newPts, rotation: 0 }
                  : item,
              );
              onElementsChange(updated);
            }}
            onDragEnd={(e) => {
              let targetX = e.target.x();
              let targetY = e.target.y();
              const isShift = Boolean(e.evt?.shiftKey) || isShiftPressedRef.current;
              if (isShift) {
                const { dx, dy } = snapTo45Degrees(targetX - p2.x, targetY - p2.y);
                targetX = p2.x + dx;
                targetY = p2.y + dy;
              }
              const newPts = [
                targetX - lineElement.x,
                targetY - lineElement.y,
                x2,
                y2,
              ];
              const updated = elements.map((item) =>
                item.id === lineElement.id
                  ? { ...item, points: newPts, rotation: 0 }
                  : item,
              );
              recordSnapshot(updated);
            }}
          />
          {/* End Anchor */}
          <Circle
            name="_anchor"
            x={p2.x}
            y={p2.y}
            radius={themeConfig.transformer.anchorSize / 2}
            fill={themeConfig.transformer.anchorFill}
            stroke={themeConfig.transformer.anchorStroke}
            strokeWidth={1.5}
            draggable
            dragBoundFunc={(pos) => {
              const isShift = isShiftPressedRef.current;
              if (!isShift) return pos;
              const { dx, dy } = snapTo45Degrees(pos.x - p1.x, pos.y - p1.y);
              return { x: p1.x + dx, y: p1.y + dy };
            }}
            onDragMove={(e) => {
              let targetX = e.target.x();
              let targetY = e.target.y();
              const isShift = Boolean(e.evt?.shiftKey) || isShiftPressedRef.current;
              if (isShift) {
                const { dx, dy } = snapTo45Degrees(targetX - p1.x, targetY - p1.y);
                targetX = p1.x + dx;
                targetY = p1.y + dy;
              }
              const newPts = [
                x1,
                y1,
                targetX - lineElement.x,
                targetY - lineElement.y,
              ];
              const updated = elements.map((item) =>
                item.id === lineElement.id
                  ? { ...item, points: newPts, rotation: 0 }
                  : item,
              );
              onElementsChange(updated);
            }}
            onDragEnd={(e) => {
              let targetX = e.target.x();
              let targetY = e.target.y();
              const isShift = Boolean(e.evt?.shiftKey) || isShiftPressedRef.current;
              if (isShift) {
                const { dx, dy } = snapTo45Degrees(targetX - p1.x, targetY - p1.y);
                targetX = p1.x + dx;
                targetY = p1.y + dy;
              }
              const newPts = [
                x1,
                y1,
                targetX - lineElement.x,
                targetY - lineElement.y,
              ];
              const updated = elements.map((item) =>
                item.id === lineElement.id
                  ? { ...item, points: newPts, rotation: 0 }
                  : item,
              );
              recordSnapshot(updated);
            }}
          />
        </Group>
      );
    }
  }

  const enabledAnchors = isTextOnly
    ? ["top-left", "top-right", "bottom-left", "bottom-right"]
    : [
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
        "top-center",
        "bottom-center",
        "middle-left",
        "middle-right",
      ];

  return (
    <Transformer
      ref={trRef}
      boundBoxFunc={(oldBox, newBox) => {
        if (Math.abs(newBox.width) < 4 || Math.abs(newBox.height) < 4) {
          return oldBox;
        }
        return newBox;
      }}
      enabledAnchors={enabledAnchors}
      keepRatio={hasTextOrImage}
      ignoreStroke={true}
      rotationSnaps={isShiftPressed ? [0, 45, 90, 135, 180, 225, 270, 315] : []}
      rotationSnapTolerance={isShiftPressed ? 22.5 : 0}
      borderStroke={themeConfig.transformer.borderStroke}
      borderDash={themeConfig.transformer.borderDash as unknown as number[]}
      borderStrokeWidth={1.5}
      anchorStroke={themeConfig.transformer.anchorStroke}
      anchorFill={themeConfig.transformer.anchorFill}
      anchorSize={themeConfig.transformer.anchorSize}
      anchorCornerRadius={themeConfig.transformer.anchorCornerRadius}
      onTransformEnd={handleTransformEnd}
    />
  );
}
