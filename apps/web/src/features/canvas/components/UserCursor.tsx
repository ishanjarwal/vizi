"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { canvasToScreenPoint } from "../utils/helper";
import type { UserCursorProps as Props } from "../types";

export function UserCursor({ peer, transform }: Props) {
  const { cursor, color, name } = peer;

  if (!cursor) {
    return null;
  }

  const screenPoint = canvasToScreenPoint({ x: cursor.x, y: cursor.y }, transform);

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-30 select-none will-change-transform"
      style={{
        transform: `translate3d(${screenPoint.x}px, ${screenPoint.y}px, 0)`,
        transition: "transform 60ms linear",
      }}
    >
      {/* SVG Cursor Pointer */}
      <svg
        className="size-5 -translate-x-0.5 -translate-y-0.5 drop-shadow-md"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color}
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* User Name Badge beneath cursor */}
      <div
        className="mt-0.5 ml-3.5 flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-white shadow-md ring-1 ring-black/10"
        style={{
          backgroundColor: color,
        }}
      >
        <span>{name}</span>
        {cursor.isDrawing ? (
          <Pencil className="size-2.5 animate-pulse text-white/90" />
        ) : null}
      </div>
    </div>
  );
}

export default UserCursor;
