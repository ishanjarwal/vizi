import { z } from "zod";

/**
 * Base canvas element properties shared across all shape primitives.
 */
export const BaseElementSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  stroke: z.string(),
  strokeWidth: z.number().nonnegative(),
  fill: z.string(),
  opacity: z.number().min(0).max(1),
  cornerRadius: z.number().optional(),
  text: z.string().optional(),
  fontSize: z.number().optional(),

  // Conflict resolution and synchronization metadata
  version: z.number().int().nonnegative().default(1),
  updatedAt: z.number().nonnegative().default(() => Date.now()),
  createdBy: z.string().default("anonymous"),
  isDeleted: z.boolean().optional().default(false),
});

export const RectangleElementSchema = BaseElementSchema.extend({
  type: z.literal("rectangle"),
  width: z.number(),
  height: z.number(),
});

export const EllipseElementSchema = BaseElementSchema.extend({
  type: z.literal("ellipse"),
  radiusX: z.number(),
  radiusY: z.number(),
});

export const DiamondElementSchema = BaseElementSchema.extend({
  type: z.literal("diamond"),
  width: z.number(),
  height: z.number(),
});

export const LineElementSchema = BaseElementSchema.extend({
  type: z.literal("line"),
  points: z.array(z.number()),
});

export const ArrowElementSchema = BaseElementSchema.extend({
  type: z.literal("arrow"),
  points: z.array(z.number()),
});

export const StickyElementSchema = BaseElementSchema.extend({
  type: z.literal("sticky"),
  width: z.number(),
  height: z.number(),
  colorScheme: z.string(),
});

export const TextElementSchema = BaseElementSchema.extend({
  type: z.literal("text"),
  text: z.string(),
  fontSize: z.number(),
  fontFamily: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const ImageElementSchema = BaseElementSchema.extend({
  type: z.literal("image"),
  src: z.string(),
  aspectRatio: z.number(),
  width: z.number(),
  height: z.number(),
});

export const PenElementSchema = BaseElementSchema.extend({
  type: z.literal("pen"),
  points: z.array(z.number()),
});

/**
 * Discriminated union of all supported canvas elements.
 */
export const CanvasElementSchema = z.discriminatedUnion("type", [
  RectangleElementSchema,
  EllipseElementSchema,
  DiamondElementSchema,
  LineElementSchema,
  ArrowElementSchema,
  StickyElementSchema,
  TextElementSchema,
  ImageElementSchema,
  PenElementSchema,
]);

export type CanvasElement = z.infer<typeof CanvasElementSchema>;
export type RectangleElement = z.infer<typeof RectangleElementSchema>;
export type EllipseElement = z.infer<typeof EllipseElementSchema>;
export type DiamondElement = z.infer<typeof DiamondElementSchema>;
export type LineElement = z.infer<typeof LineElementSchema>;
export type ArrowElement = z.infer<typeof ArrowElementSchema>;
export type StickyElement = z.infer<typeof StickyElementSchema>;
export type TextElement = z.infer<typeof TextElementSchema>;
export type ImageElement = z.infer<typeof ImageElementSchema>;
export type PenElement = z.infer<typeof PenElementSchema>;
export type ElementType = CanvasElement["type"];
