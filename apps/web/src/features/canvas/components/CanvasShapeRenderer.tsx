"use client";

import type Konva from "konva";
import * as React from "react";
import {
  Arrow,
  Ellipse,
  Group,
  Image as KonvaImage,
  Line,
  Rect,
  Text,
} from "react-konva";
import { CANVAS_THEME } from "../constants/canvas-theme";
import { useImageLoader } from "../hooks/useImageLoader";
import type { CanvasShapeRendererProps as Props } from "../types";

export function CanvasShapeRenderer({
  element,
  isDraggable,
  isPendingDelete = false,
  isEditing = false,
  theme = "light",
  onDragStart,
  onDragMove,
  onDragEnd,
  onSelect,
  onDoubleClick,
}: Props) {
  const isDark = theme === "dark";
  const defaultTextColor = isDark ? "#f8fafc" : "#1e1e1e";
  const stickyTextColor = isDark ? "#f8fafc" : "#1e293b";
  const image = useImageLoader(element.type === "image" ? element.src : "");
  const opacity = isPendingDelete
    ? CANVAS_THEME.eraser.pendingDeleteOpacity
    : element.opacity;

  const handlePointerDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    // Only capture primary button
    if ("button" in e.evt && e.evt.button !== 0) return;
    if (!isDraggable) return;
    e.cancelBubble = true;
    const shiftKey = "shiftKey" in e.evt ? Boolean(e.evt.shiftKey) : false;
    onSelect(element.id, shiftKey);
  };

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    onDragStart?.(element.id, e.target.x(), e.target.y());
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    onDragMove?.(element.id, e.target.x(), e.target.y());
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    onDragEnd(element.id, e.target.x(), e.target.y());
  };

  const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onDoubleClick(element);
  };

  switch (element.type) {
    case "rectangle":
      return (
        <Group
          id={element.id}
          x={element.x}
          y={element.y}
          rotation={element.rotation ?? 0}
          draggable={isDraggable}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDblClick={handleDblClick}
        >
          <Rect
            width={element.width}
            height={element.height}
            cornerRadius={element.cornerRadius ?? CANVAS_THEME.defaultShape.cornerRadius}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            strokeScaleEnabled={false}
            fill={element.fill}
            opacity={opacity}
          />
          {element.text && !isEditing ? (
            <Text
              width={element.width}
              height={element.height}
              text={element.text}
              align="center"
              verticalAlign="middle"
              fontSize={element.fontSize ?? CANVAS_THEME.defaultShape.fontSize}
              fontFamily={CANVAS_THEME.fonts.canvas}
              fill={element.stroke || defaultTextColor}
              wrap="word"
              padding={6}
            />
          ) : null}
        </Group>
      );

    case "ellipse":
      return (
        <Group
          id={element.id}
          x={element.x}
          y={element.y}
          rotation={element.rotation ?? 0}
          draggable={isDraggable}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDblClick={handleDblClick}
        >
          <Ellipse
            radiusX={element.radiusX}
            radiusY={element.radiusY}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            strokeScaleEnabled={false}
            fill={element.fill}
            opacity={opacity}
          />
          {element.text && !isEditing ? (
            <Text
              x={-element.radiusX}
              y={-element.radiusY}
              width={element.radiusX * 2}
              height={element.radiusY * 2}
              text={element.text}
              align="center"
              verticalAlign="middle"
              fontSize={element.fontSize ?? CANVAS_THEME.defaultShape.fontSize}
              fontFamily={CANVAS_THEME.fonts.canvas}
              fill={element.stroke || defaultTextColor}
              wrap="word"
              padding={6}
            />
          ) : null}
        </Group>
      );

    case "diamond":
      return (
        <Group
          id={element.id}
          x={element.x}
          y={element.y}
          rotation={element.rotation ?? 0}
          draggable={isDraggable}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDblClick={handleDblClick}
        >
          <Line
            closed
            points={[
              element.width / 2,
              0,
              element.width,
              element.height / 2,
              element.width / 2,
              element.height,
              0,
              element.height / 2,
            ]}
            lineJoin="round"
            lineCap="round"
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            strokeScaleEnabled={false}
            fill={element.fill}
            opacity={opacity}
          />
          {element.text && !isEditing ? (
            <Text
              width={element.width}
              height={element.height}
              text={element.text}
              align="center"
              verticalAlign="middle"
              fontSize={element.fontSize ?? CANVAS_THEME.defaultShape.fontSize}
              fontFamily={CANVAS_THEME.fonts.canvas}
              fill={element.stroke || defaultTextColor}
              wrap="word"
              padding={8}
            />
          ) : null}
        </Group>
      );

    case "line":
      return (
        <Line
          id={element.id}
          x={element.x}
          y={element.y}
          rotation={element.rotation ?? 0}
          points={element.points}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          strokeScaleEnabled={false}
          opacity={opacity}
          lineCap="round"
          lineJoin="round"
          draggable={isDraggable}
          hitStrokeWidth={16}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      );

    case "arrow":
      return (
        <Arrow
          id={element.id}
          x={element.x}
          y={element.y}
          rotation={element.rotation ?? 0}
          points={element.points}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          strokeScaleEnabled={false}
          fill={element.stroke}
          pointerLength={10}
          pointerWidth={10}
          opacity={opacity}
          lineCap="round"
          lineJoin="round"
          draggable={isDraggable}
          hitStrokeWidth={16}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      );

    case "pen":
      return (
        <Line
          id={element.id}
          x={element.x}
          y={element.y}
          rotation={element.rotation ?? 0}
          points={element.points}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          strokeScaleEnabled={false}
          opacity={opacity}
          tension={0.4}
          lineCap="round"
          lineJoin="round"
          draggable={isDraggable}
          hitStrokeWidth={16}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      );

    case "sticky":
      return (
        <Group
          id={element.id}
          x={element.x}
          y={element.y}
          rotation={element.rotation ?? 0}
          draggable={isDraggable}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDblClick={handleDblClick}
        >
          <Rect
            width={element.width}
            height={element.height}
            fill={element.colorScheme || element.fill || CANVAS_THEME.stickyNote.defaultColor}
            stroke={element.stroke || "rgba(0,0,0,0.06)"}
            strokeWidth={1}
            strokeScaleEnabled={false}
            cornerRadius={element.cornerRadius ?? CANVAS_THEME.stickyNote.cornerRadius}
            shadowColor="rgba(0,0,0,0.08)"
            shadowBlur={10}
            shadowOffset={{ x: 2, y: 3 }}
            shadowOpacity={0.7}
            opacity={opacity}
          />
          {element.text && !isEditing ? (
            <Text
              x={14}
              y={14}
              width={element.width - 28}
              height={element.height - 28}
              text={element.text}
              fontSize={element.fontSize ?? CANVAS_THEME.stickyNote.fontSize}
              lineHeight={1.3}
              fontFamily={CANVAS_THEME.fonts.canvas}
              fill={stickyTextColor}
              wrap="word"
            />
          ) : null}
        </Group>
      );

    case "text":
      return (
        <Text
          id={element.id}
          x={element.x}
          y={element.y}
          rotation={element.rotation ?? 0}
          text={element.text || (isEditing ? "" : "Type something...")}
          fontSize={element.fontSize ?? 24}
          fontFamily={element.fontFamily || CANVAS_THEME.fonts.canvas}
          fill={element.stroke || defaultTextColor}
          opacity={isEditing ? 0 : opacity}
          draggable={isDraggable}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDblClick={handleDblClick}
        />
      );

    case "image":
      return (
        <KonvaImage
          id={element.id}
          x={element.x}
          y={element.y}
          rotation={element.rotation ?? 0}
          image={image ?? undefined}
          width={element.width}
          height={element.height}
          opacity={opacity}
          draggable={isDraggable}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      );

    default:
      return null;
  }
}
