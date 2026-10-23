"use client";

import * as React from "react";
import { CANVAS_THEME } from "../constants/canvas-theme";
import type { TextEditorOverlayProps as Props } from "../types";

export function TextEditorOverlay({
  element,
  transform,
  onChangeText,
  onFinish,
  theme = "light",
}: Props) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [text, setText] = React.useState(element?.text ?? "");

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, []);

  React.useEffect(() => {
    if (textareaRef.current && element?.type === "text") {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(36, textareaRef.current.scrollHeight)}px`;
    }
  }, [text, element?.type]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    onChangeText(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onFinish();
      return;
    }

    if (e.key === "Enter") {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        onFinish();
        return;
      }

      // Inside closed shapes (rectangle, ellipse, diamond), single Enter finishes
      const isClosedShape =
        element?.type === "rectangle" ||
        element?.type === "ellipse" ||
        element?.type === "diamond";

      if (isClosedShape && !e.shiftKey) {
        e.preventDefault();
        onFinish();
      }
    }
  };

  if (!element) return null;

  let screenX = transform.x + element.x * transform.scale;
  let screenY = transform.y + element.y * transform.scale;
  let screenWidth = 200 * transform.scale;
  let screenHeight = 44 * transform.scale;
  let fontSize = 18 * transform.scale;
  let isCentered = false;

  switch (element.type) {
    case "rectangle":
    case "diamond":
      screenWidth = element.width * transform.scale;
      screenHeight = element.height * transform.scale;
      fontSize = 18 * transform.scale;
      isCentered = true;
      break;

    case "ellipse":
      screenX = transform.x + (element.x - element.radiusX) * transform.scale;
      screenY = transform.y + (element.y - element.radiusY) * transform.scale;
      screenWidth = element.radiusX * 2 * transform.scale;
      screenHeight = element.radiusY * 2 * transform.scale;
      fontSize = 18 * transform.scale;
      isCentered = true;
      break;

    case "sticky":
      screenX = transform.x + (element.x + 14) * transform.scale;
      screenY = transform.y + (element.y + 14) * transform.scale;
      screenWidth = Math.max(40, (element.width - 28) * transform.scale);
      screenHeight = Math.max(40, (element.height - 28) * transform.scale);
      fontSize = 18 * transform.scale;
      isCentered = false;
      break;

    case "text":
      screenWidth = Math.max(160, 200 * transform.scale);
      screenHeight = Math.max(36, (element.fontSize ?? 24) * 1.3 * transform.scale);
      fontSize = (element.fontSize ?? 24) * transform.scale;
      isCentered = false;
      break;
  }

  const isDark = theme === "dark";
  const isSticky = element.type === "sticky";
  const defaultText = isDark ? "#f8fafc" : "#1e1e1e";
  const stickyText = isDark ? "#f8fafc" : "#1e293b";
  const textColor = isSticky ? stickyText : (element.stroke || defaultText);
  const scaledFontSize = Math.max(12, Math.round(fontSize));
  const containerAlignment = isCentered
    ? "items-center justify-center"
    : "items-start justify-start";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="false"
    >
      <div
        className={`pointer-events-auto absolute flex ${containerAlignment} overflow-visible`}
        style={{
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: element.type === "text" ? "auto" : `${screenWidth}px`,
          minWidth: element.type === "text" ? `${screenWidth}px` : undefined,
          maxWidth: "800px",
          height: element.type === "text" ? "auto" : `${screenHeight}px`,
          minHeight: `${screenHeight}px`,
        }}
      >
        <textarea
          ref={textareaRef}
          autoFocus
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={onFinish}
          rows={1}
          placeholder={
            element.type === "text"
              ? "Type something..."
              : isSticky
                ? "Write a note..."
                : ""
          }
          className={`w-full resize-none border-none bg-transparent p-0 font-canvas outline-none ${
            isCentered ? "text-center" : "text-left"
          }`}
          style={{
            fontFamily: CANVAS_THEME.fonts.canvas,
            fontSize: `${scaledFontSize}px`,
            lineHeight: isSticky ? 1.3 : 1,
            color: textColor,
            height: isSticky ? `${screenHeight}px` : undefined,
          }}
        />
      </div>
    </div>
  );
}
