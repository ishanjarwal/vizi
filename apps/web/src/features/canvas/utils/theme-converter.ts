import type { CanvasElement } from "../types";

// Stroke color conversions (Light <-> Dark)
const STROKE_LIGHT_TO_DARK: Record<string, string> = {
  "#1e293b": "#f8fafc",
  "#1e1e1e": "#f8fafc",
  "#000000": "#f8fafc",
  "#0f172a": "#f8fafc",
  "#334155": "#e2e8f0",
  "#e11d48": "#fb7185",
  "#2563eb": "#60a5fa",
  "#16a34a": "#4ade80",
  "#d97706": "#fbbf24",
  "#9333ea": "#c084fc",
};

const STROKE_DARK_TO_LIGHT: Record<string, string> = {
  "#f8fafc": "#1e293b",
  "#ffffff": "#1e293b",
  "#e2e8f0": "#1e293b",
  "#fb7185": "#e11d48",
  "#60a5fa": "#2563eb",
  "#4ade80": "#16a34a",
  "#fbbf24": "#d97706",
  "#c084fc": "#9333ea",
};

// Fill color conversions (Light <-> Dark)
const FILL_LIGHT_TO_DARK: Record<string, string> = {
  "#fff1f2": "#3b1d28",
  "#fef08a": "#453310",
  "#dcfce7": "#143d22",
  "#e0f2fe": "#172e4c",
  "#f3e8ff": "#331b4d",
  "#fed7aa": "#4a2211",
  "#f1f5f9": "#1e293b",
  "#ffffff": "#1e1e24",
};

const FILL_DARK_TO_LIGHT: Record<string, string> = {
  "#3b1d28": "#fff1f2",
  "#453310": "#fef08a",
  "#143d22": "#dcfce7",
  "#172e4c": "#e0f2fe",
  "#331b4d": "#f3e8ff",
  "#4a2211": "#fed7aa",
  "#1e293b": "#f1f5f9",
  "#1e1e24": "#ffffff",
};

// Sticky note palette conversions (Light <-> Dark)
const STICKY_LIGHT_TO_DARK: Record<string, string> = {
  "#fef08a": "#713f12",
  "#fef9c3": "#713f12",
  "#fbcfe8": "#831843",
  "#ffe4e6": "#831843",
  "#bbf7d0": "#14532d",
  "#dcfce7": "#14532d",
  "#bae6fd": "#1e3a8a",
  "#e0f2fe": "#1e3a8a",
  "#e9d5ff": "#581c87",
  "#f3e8ff": "#581c87",
  "#fed7aa": "#7c2d12",
};

const STICKY_DARK_TO_LIGHT: Record<string, string> = {
  "#713f12": "#fef08a",
  "#831843": "#fbcfe8",
  "#14532d": "#bbf7d0",
  "#1e3a8a": "#bae6fd",
  "#581c87": "#e9d5ff",
  "#7c2d12": "#fed7aa",
};

/**
 * Converts an individual CanvasElement to its corresponding representation for the target theme.
 */
export function convertElementTheme(
  element: CanvasElement,
  toTheme: "light" | "dark",
): CanvasElement {
  if (toTheme === "dark") {
    switch (element.type) {
      case "sticky": {
        const lowerScheme = element.colorScheme.toLowerCase();
        const lowerFill = element.fill?.toLowerCase() ?? "";
        const nextScheme = STICKY_LIGHT_TO_DARK[lowerScheme] ?? element.colorScheme;
        const nextFill = STICKY_LIGHT_TO_DARK[lowerFill] ?? element.fill;
        return {
          ...element,
          colorScheme: nextScheme,
          fill: nextFill,
          stroke: "rgba(255,255,255,0.08)",
        };
      }

      case "rectangle":
      case "diamond":
      case "ellipse": {
        const lowerStroke = element.stroke.toLowerCase();
        const lowerFill = element.fill.toLowerCase();
        const nextStroke = STROKE_LIGHT_TO_DARK[lowerStroke] ?? element.stroke;
        const nextFill =
          lowerFill === "transparent"
            ? "transparent"
            : (FILL_LIGHT_TO_DARK[lowerFill] ?? element.fill);
        return {
          ...element,
          stroke: nextStroke,
          fill: nextFill,
        };
      }

      case "line":
      case "arrow":
      case "pen":
      case "text": {
        const lowerStroke = element.stroke.toLowerCase();
        const nextStroke = STROKE_LIGHT_TO_DARK[lowerStroke] ?? element.stroke;
        return {
          ...element,
          stroke: nextStroke,
        };
      }

      case "image":
        return element;
    }
  } else {
    // Convert to Light Theme
    switch (element.type) {
      case "sticky": {
        const lowerScheme = element.colorScheme.toLowerCase();
        const lowerFill = element.fill?.toLowerCase() ?? "";
        const nextScheme = STICKY_DARK_TO_LIGHT[lowerScheme] ?? element.colorScheme;
        const nextFill = STICKY_DARK_TO_LIGHT[lowerFill] ?? element.fill;
        return {
          ...element,
          colorScheme: nextScheme,
          fill: nextFill,
          stroke: "rgba(0,0,0,0.06)",
        };
      }

      case "rectangle":
      case "diamond":
      case "ellipse": {
        const lowerStroke = element.stroke.toLowerCase();
        const lowerFill = element.fill.toLowerCase();
        const nextStroke = STROKE_DARK_TO_LIGHT[lowerStroke] ?? element.stroke;
        const nextFill =
          lowerFill === "transparent"
            ? "transparent"
            : (FILL_DARK_TO_LIGHT[lowerFill] ?? element.fill);
        return {
          ...element,
          stroke: nextStroke,
          fill: nextFill,
        };
      }

      case "line":
      case "arrow":
      case "pen":
      case "text": {
        const lowerStroke = element.stroke.toLowerCase();
        const nextStroke = STROKE_DARK_TO_LIGHT[lowerStroke] ?? element.stroke;
        return {
          ...element,
          stroke: nextStroke,
        };
      }

      case "image":
        return element;
    }
  }
}

/**
 * Converts a list of CanvasElements to the target theme.
 */
export function convertElementsToTheme(
  elements: CanvasElement[],
  toTheme: "light" | "dark",
): CanvasElement[] {
  return elements.map((el) => convertElementTheme(el, toTheme));
}

/**
 * Converts a stroke color to the target theme.
 */
export function convertStrokeColor(
  color: string,
  toTheme: "light" | "dark",
): string {
  const lower = color.toLowerCase();
  if (toTheme === "dark") {
    return STROKE_LIGHT_TO_DARK[lower] ?? color;
  }
  return STROKE_DARK_TO_LIGHT[lower] ?? color;
}

/**
 * Converts a fill color to the target theme.
 */
export function convertFillColor(
  color: string,
  toTheme: "light" | "dark",
): string {
  const lower = color.toLowerCase();
  if (lower === "transparent") return "transparent";
  if (toTheme === "dark") {
    return FILL_LIGHT_TO_DARK[lower] ?? color;
  }
  return FILL_DARK_TO_LIGHT[lower] ?? color;
}

const CANVAS_BG_LIGHT_TO_DARK: Record<string, string> = {
  "#ffffff": "#121214",
  "#f8fafc": "#0f172a",
  "#fff1f2": "#201217",
  "#fefce8": "#20190c",
  "#f0fdf4": "#0d2216",
  "#f0f9ff": "#0d1b32",
  "#faf5ff": "#1b112c",
};

const CANVAS_BG_DARK_TO_LIGHT: Record<string, string> = {
  "#121214": "#ffffff",
  "#0f172a": "#f8fafc",
  "#201217": "#fff1f2",
  "#20190c": "#fefce8",
  "#0d2216": "#f0fdf4",
  "#0d1b32": "#f0f9ff",
  "#1b112c": "#faf5ff",
};

/**
 * Converts a canvas background color to the target theme.
 */
export function convertCanvasBgColor(
  color: string,
  toTheme: "light" | "dark",
): string {
  const lower = color.toLowerCase();
  if (toTheme === "dark") {
    return CANVAS_BG_LIGHT_TO_DARK[lower] ?? color;
  }
  return CANVAS_BG_DARK_TO_LIGHT[lower] ?? color;
}
