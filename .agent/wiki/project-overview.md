# Project Overview — Vizi

## 1. Vision & Executive Summary

**Vizi** is a lightweight, ultra-responsive, real-time collaborative whiteboard application built with modern web technologies in a Turborepo monorepo.

The primary engineering goal of Vizi is to demonstrate **low-latency real-time synchronization, architectural elegance, and robust fault tolerance**. It proves that collaborative tools can remain fluid (60-120 FPS canvas interactions, sub-50ms peer updates) without heavy infrastructure or complex authentication walls.

---

## 2. Core Product Principles

1. **Zero-Friction Access (No Auth)**: Users can create or enter any collaborative canvas room immediately without signing up, logging in, or creating passwords.
2. **Instant Collaboration**: Rooms are instantly shareable via URL link or scanned QR code. Collaborators receive an anonymous avatar color and customizable display name.
3. **Infinite Canvas**: Unbounded 2D spatial workspace with smooth zooming, panning, and high-DPI canvas rendering.
4. **Optimistic Local Execution**: All drawing, moving, resizing, and styling operations take effect locally in $<16\text{ms}$ and synchronize over WebSockets in the background.
5. **Portable State**: Full export/import capabilities allowing boards to be backed up to versioned JSON or rendered to high-resolution PNG/PDF assets.

---

## 3. Room Lifecycle & Sharing Mechanics

```
   [User arrives at /]
            │
            ├─► Click "Create Room" ──► Generate unique roomId (e.g., nanoid/slug)
            │                           Redirect to /room/:roomId
            ▼
   [Share Options]
     ├── Direct Link: https://<domain>/room/:roomId
     └── QR Code: Rendered client-side for mobile/tablet instant scan
```

- **Room Generation**: Rooms are created client-side or server-side by minting a unique, non-guessable `roomId`.
- **Peer Presence**: When a user enters `/room/:roomId`, a WebSocket handshake establishes their session. Peers in the room receive live cursor coordinates, presence status, and active selection bounding boxes.
- **Session Lifespan**: Rooms persist their active state in-memory on the server with background snapshots/persistence. Stale or empty rooms can enter dormant status and be re-hydrated on demand.

---

## 4. Canvas & Tool Specifications

### 4.1 Coordinate Space & Navigation

- **World Coordinates vs. Screen Coordinates**:
  - World space: $[-\infty, +\infty]$ coordinate plane where shapes exist with absolute $(x, y)$ coordinates.
  - Screen space: Canvas pixel coordinates transformed via Pan $(T_x, T_y)$ and Zoom $(S)$:
    $$\text{Screen}(X, Y) = (X \cdot S + T_x, \, Y \cdot S + T_y)$$
    $$\text{World}(X, Y) = \left(\frac{X - T_x}{S}, \, \frac{Y - T_y}{S}\right)$$
- **Navigation Controls**:
  - **Pan**: Spacebar + Click & Drag, Middle Mouse Button Drag, or Two-Finger Trackpad Scroll.
  - **Zoom**: Mouse Wheel (`Ctrl` + Wheel or Pinch-to-zoom) clamped between $10\%$ ($0.1\times$) and $500\%$ ($5.0\times$).

### 4.2 Primitive Shapes & Text Support

Every element drawn on canvas is a first-class object that supports an **optional centered text label**:

| Shape Type         | Description                                 | Key Interactions                                           |
| :----------------- | :------------------------------------------ | :--------------------------------------------------------- |
| **Rectangle**      | Box primitive with optional corner rounding | Corner drag resize, centered text, fill & border styling.  |
| **Ellipse**        | Oval / circle primitive                     | Bounding box resize, centered text, fill & border styling. |
| **Line**           | Two-point segment                           | End-point handles, linear curvature adjustment.            |
| **Arrow**          | Directed vector with head markers           | Start/End handles, arrowhead direction styling.            |
| **Pen (Freehand)** | Smooth vectorized stroke                    | Polyline point capture, pressure curve interpolation.      |

### 4.3 Element Attributes

All canvas elements share a baseline schema with type-specific extensions:

```typescript
// Shared Common Attributes
interface BaseElement {
  id: string; // UUID
  type: ToolType; // 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'pen'
  x: number; // World bounding box X
  y: number; // World bounding box Y
  width: number; // World width
  height: number; // World height
  strokeColor: string; // Hex / RGB / CSS token
  fillColor: string; // Hex / RGB / transparent
  strokeWidth: number; // e.g., 1, 2, 4, 8
  strokeStyle: "solid" | "dashed";
  opacity: number; // 0.0 - 1.0
  zIndex: number; // Stacking order

  // Optional Centered Text Overlay
  text?: string;
  fontSize?: number;
  textColor?: string;

  // Metadata for Sync & Conflict Resolution
  version: number; // Monotonically increasing version counter
  updatedAt: number; // Unix epoch ms
  createdBy: string; // Client ID
}
```

**Shape-Specific Properties**:

- **Pen**: `points: Array<{ x: number; y: number; pressure?: number }>`
- **Line / Arrow**: `startX: number; startY: number; endX: number; endY: number; arrowHead?: 'none' | 'end' | 'both'`
- **Rectangle**: `borderRadius?: number`

---

## 5. Export & Import Specifications

### 5.1 JSON File Export & Import

- **Serialization Schema**:
  ```json
  {
    "app": "vizi",
    "version": 1,
    "roomId": "room-xyz-123",
    "exportedAt": 1729600000000,
    "elements": [ ... ]
  }
  ```
- **Import Validation**: Validates schema version, element integrity, and sanitizes untrusted input before hydrating into the active canvas state.
- **Merge vs. Replace Option**: Allows importing as a brand new canvas or merging into the existing room.

### 5.2 Raster & Document Export (PNG / PDF)

- **PNG Export**:
  - Calculates the tight bounding box encompassing all visible, non-deleted elements.
  - Adds configurable padding (e.g. 24px) and renders to an offscreen `<canvas>` at $1\times$, $2\times$ (Retina/High-DPI), or custom scale.
  - Supports transparent or solid background color.
- **PDF Export**:
  - Converts active elements or the selected viewport to vector/raster PDF pages formatted to fit standard sizes (A4, Letter) or single-sheet poster format.

---

## 6. Showcase Focus: Real-Time & Fault Tolerance Goals

| Objective                     | Target Metric / Guarantee                                                                 |
| :---------------------------- | :---------------------------------------------------------------------------------------- |
| **Local Render Latency**      | $< 16\text{ms}$ (60–120 FPS continuous rendering during interaction)                      |
| **Network Broadcast Latency** | $< 50\text{ms}$ under typical LAN/broadband WebSocket conditions                          |
| **Conflict Resolution**       | Deterministic Last-Write-Wins (LWW) with Lamport/logical clocks per element               |
| **Reconnection Resilience**   | Automatic reconnection with exponential backoff & jitter                                  |
| **Offline Operation**         | Uninterrupted offline drawing with an optimistic mutation queue that flushes on reconnect |
| **State Consistency**         | Reconnect handshake guarantees zero dropped elements via state re-sync                    |
