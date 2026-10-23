import type {
  BoundingBox,
  CanvasElement,
  Point,
  ViewportTransform,
} from "../types";

/**
 * Converts screen/pointer coordinates to canvas space considering stage pan and zoom.
 */
export function screenToCanvasPoint(
  screenPos: Point,
  stageTransform: ViewportTransform,
): Point {
  return {
    x: (screenPos.x - stageTransform.x) / stageTransform.scale,
    y: (screenPos.y - stageTransform.y) / stageTransform.scale,
  };
}

/**
 * Converts canvas space point back to screen/viewport coordinates.
 */
export function canvasToScreenPoint(
  canvasPos: Point,
  stageTransform: ViewportTransform,
): Point {
  return {
    x: canvasPos.x * stageTransform.scale + stageTransform.x,
    y: canvasPos.y * stageTransform.scale + stageTransform.y,
  };
}

/**
 * Normalizes two diagonal points into a non-negative width/height BoundingBox.
 */
export function normalizeBoundingBox(p1: Point, p2: Point): BoundingBox {
  const x = Math.min(p1.x, p2.x);
  const y = Math.min(p1.y, p2.y);
  const width = Math.abs(p2.x - p1.x);
  const height = Math.abs(p2.y - p1.y);
  return { x, y, width, height };
}

/**
 * Computes the axis-aligned bounding box of a CanvasElement.
 */
export function getElementBoundingBox(element: CanvasElement): BoundingBox {
  switch (element.type) {
    case "rectangle":
    case "diamond":
    case "sticky":
      return {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      };

    case "ellipse":
      return {
        x: element.x - element.radiusX,
        y: element.y - element.radiusY,
        width: element.radiusX * 2,
        height: element.radiusY * 2,
      };

    case "text":
      return {
        x: element.x,
        y: element.y,
        width: element.width ?? 120,
        height: element.height ?? (element.fontSize ? element.fontSize * 1.4 : 28),
      };

    case "image":
      return {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      };

    case "line":
    case "arrow":
    case "pen": {
      const pts = element.points;
      if (pts.length < 2) {
        return { x: element.x, y: element.y, width: 0, height: 0 };
      }
      let minX = pts[0];
      let maxX = pts[0];
      let minY = pts[1];
      let maxY = pts[1];
      for (let i = 0; i < pts.length; i += 2) {
        const px = pts[i];
        const py = pts[i + 1];
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
      return {
        x: element.x + minX,
        y: element.y + minY,
        width: Math.max(maxX - minX, 1),
        height: Math.max(maxY - minY, 1),
      };
    }
  }
}

/**
 * Determines whether elementBox is fully enclosed by selectionBox.
 */
export function isEnclosed(
  selectionBox: BoundingBox,
  elementBox: BoundingBox,
): boolean {
  return (
    elementBox.x >= selectionBox.x &&
    elementBox.y >= selectionBox.y &&
    elementBox.x + elementBox.width <= selectionBox.x + selectionBox.width &&
    elementBox.y + elementBox.height <= selectionBox.y + selectionBox.height
  );
}

/**
 * Computes offset to position text at the geometric center of a shape.
 */
export function getCenterTextOffset(
  width: number,
  height: number,
  textHeight: number,
): Point {
  return {
    x: 0,
    y: Math.max(0, (height - textHeight) / 2),
  };
}

/**
 * Shortest distance from point P to segment AB.
 */
export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    const px = p.x - a.x;
    const py = p.y - a.y;
    return Math.sqrt(px * px + py * py);
  }

  // Projection scalar t onto line AB
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  const distX = p.x - projX;
  const distY = p.y - projY;

  return Math.sqrt(distX * distX + distY * distY);
}

/**
 * Hit test for lines, arrows, or polyline paths.
 */
export function intersectsLine(
  point: Point,
  lineCoords: number[],
  threshold = 8,
): boolean {
  for (let i = 0; i < lineCoords.length - 2; i += 2) {
    const a = { x: lineCoords[i], y: lineCoords[i + 1] };
    const b = { x: lineCoords[i + 2], y: lineCoords[i + 3] };
    if (distanceToSegment(point, a, b) <= threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Point hit test for an element, used by the eraser and click selection.
 */
export function isPointInElement(
  point: Point,
  element: CanvasElement,
  threshold = 8,
): boolean {
  switch (element.type) {
    case "rectangle":
    case "diamond":
    case "sticky": {
      return (
        point.x >= element.x - threshold &&
        point.x <= element.x + element.width + threshold &&
        point.y >= element.y - threshold &&
        point.y <= element.y + element.height + threshold
      );
    }
    case "ellipse": {
      const dx = point.x - element.x;
      const dy = point.y - element.y;
      const rx = element.radiusX + threshold;
      const ry = element.radiusY + threshold;
      return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
    }
    case "text":
    case "image": {
      const box = getElementBoundingBox(element);
      return (
        point.x >= box.x - threshold &&
        point.x <= box.x + box.width + threshold &&
        point.y >= box.y - threshold &&
        point.y <= box.y + box.height + threshold
      );
    }
    case "line":
    case "arrow":
    case "pen": {
      // Points in element are relative to element.x, element.y
      const relPoint = { x: point.x - element.x, y: point.y - element.y };
      return intersectsLine(relPoint, element.points, threshold);
    }
  }
}

/**
 * Simple unique ID generator for elements.
 */
export function generateElementId(prefix = "el"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
