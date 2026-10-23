export const CANVAS_THEME = {
  transformer: {
    borderStroke: "#e11d48", // Rose-600 / primary accent
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
  },
  eraser: {
    pendingDeleteOpacity: 0.25,
    trailStroke: "rgba(239, 68, 68, 0.4)",
    trailWidth: 16,
  },
  stickyNote: {
    defaultColor: "#fef08a", // Warm vibrant pastel yellow
    cornerRadius: 8,
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
  },
} as const;
