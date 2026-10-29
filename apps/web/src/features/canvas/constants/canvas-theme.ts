export const CANVAS_LIGHT_THEME = {
  transformer: {
    borderStroke: "#e11d48", // Rose-600
    borderDash: [4, 4],
    anchorStroke: "#e11d48",
    anchorFill: "#ffffff",
    anchorSize: 9,
    anchorCornerRadius: 4,
  },
  marquee: {
    stroke: "#e11d48",
    fill: "rgba(225, 29, 72, 0.08)",
    strokeWidth: 1,
    dash: [4, 4],
  },
  defaultShape: {
    stroke: "#1e293b",
    strokeWidth: 2,
    fill: "#fff1f2", // Soft light rose pastel background
    cornerRadius: 12,
    opacity: 1,
    fontSize: 24,
  },
  eraser: {
    pendingDeleteOpacity: 0.25,
    trailStroke: "rgba(239, 68, 68, 0.4)",
    trailWidth: 16,
  },
  stickyNote: {
    defaultColor: "#fef08a", // Warm vibrant pastel yellow
    cornerRadius: 8,
    textColor: "#1e293b",
    fontSize: 24,
    colors: [
      { name: "Yellow", value: "#fef08a" },
      { name: "Pink", value: "#fbcfe8" },
      { name: "Green", value: "#bbf7d0" },
      { name: "Blue", value: "#bae6fd" },
      { name: "Purple", value: "#e9d5ff" },
      { name: "Orange", value: "#fed7aa" },
    ],
  },
  fonts: {
    canvas: "'Instrument Serif', 'Instrument Serif Fallback', Georgia, serif",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'Fira Code', 'Courier New', monospace",
  },
  zoom: {
    min: 0.1,
    max: 5.0,
    step: 0.1,
    default: 1.0,
  },
  history: {
    maxDepth: 50,
  },
  palette: {
    fills: [
      { name: "Transparent", value: "transparent" },
      { name: "Rose", value: "#fff1f2" },
      { name: "Yellow", value: "#fef08a" },
      { name: "Green", value: "#dcfce7" },
      { name: "Blue", value: "#e0f2fe" },
      { name: "Purple", value: "#f3e8ff" },
      { name: "Orange", value: "#fed7aa" },
    ],
    strokes: [
      { name: "Slate", value: "#1e293b" },
      { name: "Rose", value: "#e11d48" },
      { name: "Blue", value: "#2563eb" },
      { name: "Green", value: "#16a34a" },
      { name: "Amber", value: "#d97706" },
      { name: "Purple", value: "#9333ea" },
    ],
    strokeWidths: [
      { label: "Thin", value: 1 },
      { label: "Medium", value: 2 },
      { label: "Thick", value: 4 },
    ],
    fontSizes: [
      { label: "S", value: 18 },
      { label: "M", value: 24 },
      { label: "L", value: 36 },
      { label: "XL", value: 48 },
    ],
    canvasBackgrounds: [
      { id: "default", name: "Default", value: "#ffffff" },
      { id: "slate", name: "Slate", value: "#f8fafc" },
      { id: "rose", name: "Rose", value: "#fff1f2" },
      { id: "amber", name: "Amber", value: "#fefce8" },
      { id: "green", name: "Green", value: "#f0fdf4" },
      { id: "blue", name: "Blue", value: "#f0f9ff" },
      { id: "purple", name: "Purple", value: "#faf5ff" },
    ],
  },
} as const;

export const CANVAS_DARK_THEME = {
  transformer: {
    borderStroke: "#fb7185", // Rose-400 (bright contrast on dark)
    borderDash: [4, 4],
    anchorStroke: "#fb7185",
    anchorFill: "#1e1e24",
    anchorSize: 9,
    anchorCornerRadius: 4,
  },
  marquee: {
    stroke: "#fb7185",
    fill: "rgba(251, 113, 133, 0.12)",
    strokeWidth: 1,
    dash: [4, 4],
  },
  defaultShape: {
    stroke: "#f8fafc", // Light crisp contrast slate
    strokeWidth: 2,
    fill: "#3b1d28", // Deep muted rose background
    cornerRadius: 12,
    opacity: 1,
    fontSize: 24,
  },
  eraser: {
    pendingDeleteOpacity: 0.25,
    trailStroke: "rgba(244, 63, 94, 0.4)",
    trailWidth: 16,
  },
  stickyNote: {
    defaultColor: "#713f12", // Rich deep amber/yellow
    cornerRadius: 8,
    textColor: "#f8fafc",
    fontSize: 24,
    colors: [
      { name: "Yellow", value: "#713f12" },
      { name: "Pink", value: "#831843" },
      { name: "Green", value: "#14532d" },
      { name: "Blue", value: "#1e3a8a" },
      { name: "Purple", value: "#581c87" },
      { name: "Orange", value: "#7c2d12" },
    ],
  },
  fonts: {
    canvas: "'Instrument Serif', 'Instrument Serif Fallback', Georgia, serif",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'Fira Code', 'Courier New', monospace",
  },
  zoom: {
    min: 0.1,
    max: 5.0,
    step: 0.1,
    default: 1.0,
  },
  history: {
    maxDepth: 50,
  },
  palette: {
    fills: [
      { name: "Transparent", value: "transparent" },
      { name: "Rose", value: "#3b1d28" },
      { name: "Yellow", value: "#453310" },
      { name: "Green", value: "#143d22" },
      { name: "Blue", value: "#172e4c" },
      { name: "Purple", value: "#331b4d" },
      { name: "Orange", value: "#4a2211" },
    ],
    strokes: [
      { name: "White", value: "#f8fafc" },
      { name: "Rose", value: "#fb7185" },
      { name: "Blue", value: "#60a5fa" },
      { name: "Green", value: "#4ade80" },
      { name: "Amber", value: "#fbbf24" },
      { name: "Purple", value: "#c084fc" },
    ],
    strokeWidths: [
      { label: "Thin", value: 1 },
      { label: "Medium", value: 2 },
      { label: "Thick", value: 4 },
    ],
    fontSizes: [
      { label: "S", value: 18 },
      { label: "M", value: 24 },
      { label: "L", value: 36 },
      { label: "XL", value: 48 },
    ],
    canvasBackgrounds: [
      { id: "default", name: "Default", value: "#121214" },
      { id: "slate", name: "Slate", value: "#0f172a" },
      { id: "rose", name: "Rose", value: "#201217" },
      { id: "amber", name: "Amber", value: "#20190c" },
      { id: "green", name: "Green", value: "#0d2216" },
      { id: "blue", name: "Blue", value: "#0d1b32" },
      { id: "purple", name: "Purple", value: "#1b112c" },
    ],
  },
} as const;

export interface CanvasBgPreset {
  id: string;
  name: string;
  light: string;
  dark: string;
}

export const CANVAS_BG_PRESETS: readonly CanvasBgPreset[] = [
  { id: "default", name: "Default", light: "#ffffff", dark: "#121214" },
  { id: "slate", name: "Slate", light: "#f8fafc", dark: "#0f172a" },
  { id: "rose", name: "Rose", light: "#fff1f2", dark: "#201217" },
  { id: "amber", name: "Amber", light: "#fefce8", dark: "#20190c" },
  { id: "green", name: "Green", light: "#f0fdf4", dark: "#0d2216" },
  { id: "blue", name: "Blue", light: "#f0f9ff", dark: "#0d1b32" },
  { id: "purple", name: "Purple", light: "#faf5ff", dark: "#1b112c" },
] as const;

export function getCanvasBgColor(
  presetId: string,
  theme: "light" | "dark" = "light",
): string {
  const preset =
    CANVAS_BG_PRESETS.find((p) => p.id === presetId) ?? CANVAS_BG_PRESETS[0];
  return theme === "dark" ? preset.dark : preset.light;
}

export function getCanvasTheme(theme: "light" | "dark" = "light") {
  return theme === "dark" ? CANVAS_DARK_THEME : CANVAS_LIGHT_THEME;
}

export const CANVAS_THEME = CANVAS_LIGHT_THEME;
