# Implementation Plan: React-Konva Integration for Whiteboard Canvas

This execution blueprint outlines the modular integration of `react-konva` into the whiteboard application following clean architecture, strict TypeScript typing, state management, and interaction paradigms aligned with tools like Excalidraw and Figma.

---

## 1. Architecture & Directory Structure

Organize the canvas logic under `features/canvas` ensuring strict modular separation between primitives, tools, hooks, and helpers.

```text
src/
└── features/
    └── canvas/
        ├── types/
        │   └── index.ts               # Shape models, tool modes, point/canvas schemas
        ├── constants/
        │   ├── canvas-theme.ts        # Stroke colors, fill colors, widths, opacity presets
        │   └── shortcuts.ts           # Tool hotkey definitions
        ├── utils/
        │   └── helper.ts              # Mathematical, hit-test, and transform helpers
        ├── hooks/
        │   ├── useCanvasHistory.ts    # Undo/redo stack (depth: 50)
        │   ├── useCanvasTransform.ts  # Figma-style Pan & Zoom controls
        │   └── useKeyboardShortcuts.ts# Global hotkeys & delete triggers
        ├── components/
        │   ├── CanvasStage.tsx        # Main Konva Stage & Layer wrapper
        │   ├── CanvasTransformer.tsx  # Customized transformer/bounding box
        │   ├── TextEditorOverlay.tsx  # HTML/DOM textarea for live double-click editing
        │   └── SelectionMarquee.tsx   # Enclosing drag-selection rectangle
        └── toolbar_tools/
            ├── ToolManager.tsx        # Tool coordinator & stage interaction dispatcher
            ├── SelectionTool.ts       # Click/marquee selection logic
            ├── PanTool.ts             # Canvas viewport navigation logic
            ├── EraserTool.ts          # Touch-dim and commit-delete logic
            ├── RectangleTool.ts       # Drag-to-create rectangle
            ├── EllipseTool.ts         # Drag-to-create ellipse
            ├── DiamondTool.ts         # Drag-to-create diamond
            ├── LineTool.ts            # Point-to-point line tool
            ├── ArrowTool.ts           # Directed arrow connector
            ├── StickyNoteTool.ts      # Sticky note container with text
            ├── TextTool.ts            # Double-click or drag-to-create text
            └── ImageTool.ts           # Image loader and scaler

```

---

## 2. Core Type Definitions (`types/index.ts`)

Declare unified, discriminated union types for elements, stage coordinates, and theme bindings:

```typescript
export type ToolType =
  | "select"
  | "pan"
  | "eraser"
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "line"
  | "arrow"
  | "sticky"
  | "text"
  | "image";

export interface Point {
  x: number;
  y: number;
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
  isPendingDelete?: boolean; // Used by eraser
  text?: string; // Optional centered shape text
}

export type CanvasElement =
  | (BaseElementProps & { type: "rectangle" })
  | (BaseElementProps & { type: "ellipse"; radiusX: number; radiusY: number })
  | (BaseElementProps & { type: "diamond" })
  | (BaseElementProps & { type: "line"; points: number[] })
  | (BaseElementProps & { type: "arrow"; points: number[] })
  | (BaseElementProps & { type: "sticky"; colorScheme: string })
  | (BaseElementProps & { type: "text"; fontSize: number; fontFamily: string })
  | (BaseElementProps & {
      type: "image";
      src: string;
      imageElement?: HTMLImageElement;
      aspectRatio: number;
    });

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
}
```

---

## 3. Theme & Styling Tokens (`constants/canvas-theme.ts`)

Reference CSS variables or application theme tokens directly:

- **Transformer & Marquee:**
- Primary color: Bounding box stroke `hsl(var(--primary))`
- Fill: `hsla(var(--primary), 0.1)`
- Anchor buttons: Rounded corner markers, stroke `hsl(var(--primary))`, fill `hsl(var(--background))`

- **Default Element Palette:**
- Backgrounds: Transparent, soft pastels for sticky notes (`#fff9b1`, `#ffbebc`, etc.)
- Strokes: `hsl(var(--foreground))` or designated palette (`#1e1e1e`, `#e03131`, `#2f9e44`, `#1971c2`)
- Fonts: `'font-canvas', cursive, sans-serif`

---

## 4. Typesafe Mathematical Helpers (`utils/helper.ts`)

Implement pure utility functions for geometry, hit-testing, and coordinate transformations:

- `screenToCanvasPoint(screenPos: Point, stageTransform: ViewportTransform): Point`
- Converts pointer coordinates to absolute canvas coordinate space taking pan/zoom into account.

- `isEnclosed(boxA: BoundingBox, boxB: BoundingBox): boolean`
- Determines if an element's bounding box is fully contained within the marquee selection box.

- `getCenterTextOffset(width: number, height: number, textHeight: number): Point`
- Computes alignment parameters to position text at the geometric center of any shape.

- `intersectsLine(point: Point, lineCoords: number[], threshold: number): boolean`
- Collision detection for line/arrow elements during marquee or eraser sweeps.

---

## 5. Viewport Navigation: Zoom & Pan (`hooks/useCanvasTransform.ts`)

Emulate Figma viewport interaction:

1. **Panning:**

- Activated when the `Pan` tool is active or when holding `Spacebar` while dragging with left mouse click.
- Mouse-wheel drag (middle click / trackpad two-finger drag) also mutates stage translation $(x, y)$.

2. **Zooming:**

- Driven by `Ctrl + Wheel` (or `Cmd + Wheel`) and `Ctrl` + `+` / `-`.
- Zoom anchored to pointer position:

$$\text{newX} = \text{pointerX} - (\text{pointerX} - \text{stageX}) \times \frac{\text{newScale}}{\text{oldScale}}$$

- Limit zoom between $0.1\times$ and $5.0\times$.

---

## 6. History Management: Undo/Redo (`hooks/useCanvasHistory.ts`)

Maintain an immutable state history stack for canvas elements:

- Maintain `past: CanvasElement[][]`, `present: CanvasElement[]`, and `future: CanvasElement[][]`.
- Cap depth at **50 states**.
- Commits trigger strictly on interaction completions: `onDragEnd`, `onTransformEnd`, eraser mouse up, or new shape placement (debounce continuous dragging/resizing events).
- Expose: `{ elements, setElements, undo, redo, canUndo, canRedo, recordSnapshot }`.

---

## 7. Tool Implementation Matrix (`toolbar_tools/`)

| Tool            | Drag & Drop Creation Behavior                                                                           | Custom Properties & Resizing Rules                                   |
| --------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Selection**   | Click selects single element; drag over empty space opens marquee and encapsulates all elements inside. | Displays custom transformer; `Delete`/`Backspace` removes selection. |
| **Rectangle**   | Click-drag sets width and height from initial point.                                                    | Unconstrained horizontal/vertical scaling; centered editable text.   |
| **Ellipse**     | Click-drag defines radii (`radiusX`, `radiusY`).                                                        | Free aspect-ratio transformation; centered editable text.            |
| **Diamond**     | Click-drag draws rhombus inside the bounding rectangle.                                                 | Free aspect-ratio transformation; centered editable text.            |
| **Line**        | Click-drag creates two-point vector.                                                                    | Only endpoints are stretched; stroke width remains constant.         |
| **Arrow**       | Click-drag creates vector ending with a directional arrowhead.                                          | Endpoints stretched; stroke width and arrow geometry preserved.      |
| **Sticky Note** | Click or drag sets square sticky note container.                                                        | Unconstrained scaling; centered multi-line text with auto-wrap.      |
| **Text Box**    | Click-drag or double-click to place.                                                                    | **Strict aspect ratio scaling** via Konva transformer constraints.   |
| **Image**       | File dropped or picked; drag defines initial layout.                                                    | **Strict aspect ratio scaling** based on natural dimensions.         |
| **Eraser**      | Dragging across elements sets `isPendingDelete = true` (opacity $\to 0.3$).                             | On pointer release, all elements with `isPendingDelete` are purged.  |

---

## 8. Element Resizing & Transformer Rules (`CanvasTransformer.tsx`)

Wrap Konva's `<Transformer/>` with conditional properties based on the active selection type:

- **Shapes (Rectangle, Ellipse, Diamond, Sticky):**
- `enabledAnchors`: `['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']`
- `keepRatio={false}` (freeform scaling).

- **Text & Image:**
- `enabledAnchors`: Corner anchors only (`top-left`, `top-right`, `bottom-left`, `bottom-right`).
- `keepRatio={true}` (locked aspect ratio).

- **Line & Arrow:**
- Disable standard bounding transformer. Render anchor handles at control endpoints to allow stretching vectors without scaling stroke thickness.

- **Styling:**
- Rounded anchor points: `anchorCornerRadius={4}`.
- Colors matched to theme tokens (`anchorStroke`, `anchorFill`, `borderStroke`).

---

## 9. Text Editing & Double-Click Logic (`TextEditorOverlay.tsx`)

1. **Double-Click Handling:**

- Canvas listens to `onDblClick`:
- If clicked inside an existing shape, trigger embedded shape text editing.
- If clicked on empty canvas space, instantiate a new `text` element at the click coordinates.

2. **DOM Overlay Editing:**

- Mount a dynamically positioned `<textarea>` overlay directly above the canvas at the element's screen-projected coordinates.
- Apply application styling: `font-family: var(--font-canvas)`, transparent background, matching font size, line-height, and color.
- Automatically focus and select all text.
- On blur or `Escape`/`Ctrl+Enter`, synchronize the text value to canvas element state and unmount the overlay.

---

## 10. Shortcut Map (`useKeyboardShortcuts.ts`)

Wire keyboard bindings to tool selections and canvas operations using definitions from the shared constants file:

- `V` $\to$ Selection Tool
- `H` / `Space` (hold) $\to$ Pan Tool
- `R` $\to$ Rectangle Tool
- `O` $\to$ Ellipse Tool
- `D` $\to$ Diamond Tool
- `L` $\to$ Line Tool
- `A` $\to$ Arrow Tool
- `S` $\to$ Sticky Note Tool
- `T` $\to$ Text Box Tool
- `E` $\to$ Eraser Tool
- `Delete` / `Backspace` $\to$ Remove selected element(s)
- `Ctrl + Z` / `Ctrl + Shift + Z` (or `Cmd`) $\to$ Undo / Redo

---

## 11. Step-by-Step Implementation Sequence

1. **Step 1: Foundational Setup & Dependencies**

- Install `konva` and `react-konva`.
- Create `types/index.ts` and `constants/canvas-theme.ts`.
- Build coordinate transform math in `utils/helper.ts`.

2. **Step 2: Canvas Stage & Navigation**

- Build `CanvasStage.tsx` wrapping `Stage` and `Layer`.
- Implement `useCanvasTransform` for zoom (wheel/buttons) and pan (space/middle click).

3. **Step 3: History & Keyboard Control**

- Implement `useCanvasHistory` hook with 50-step capacity.
- Implement `useKeyboardShortcuts` to handle deletion, undo/redo, and tool hotkeys.

4. **Step 4: Shape Drawing & Tool Implementations**

- Create each tool in `features/canvas/toolbar_tools/`.
- Connect tool mouse events (`pointerdown`, `pointermove`, `pointerup`) to `ToolManager.tsx`.
- Implement custom rendering logic for shapes, lines, arrows, and sticky notes.

5. **Step 5: Transformer & Selection Logic**

- Build `CanvasTransformer.tsx` with rounded theme-colored anchors and aspect-ratio enforcement per shape type.
- Implement marquee bounding box logic (`SelectionMarquee.tsx`) selecting all fully enclosed elements.

6. **Step 6: Text Inline Editing & Eraser Interaction**

- Implement `TextEditorOverlay.tsx` with `'font-canvas'` for both standalone text and centered shape text.
- Wire `EraserTool.ts` to trigger dimming on hover/drag and state deletion on mouse release.

7. **Step 7: Toolbar Integration**

- Bind the existing UI toolbar state to `ToolManager` tool selection and active tool indicators.
