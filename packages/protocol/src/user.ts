import { z } from "zod";

/**
 * Curated color palette for anonymous users.
 * Selected for high visibility on both light and dark backgrounds.
 */
export const USER_PALETTE: readonly string[] = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#14B8A6", // Teal
] as const;

const ADJECTIVES = [
  "Curious",
  "Swift",
  "Bright",
  "Playful",
  "Silent",
  "Daring",
  "Gentle",
  "Clever",
  "Brave",
  "Joyful",
  "Lively",
  "Witty",
  "Kind",
  "Nimble",
  "Radiant",
] as const;

const NOUNS = [
  "Otter",
  "Falcon",
  "Koala",
  "Fox",
  "Panda",
  "Lynx",
  "Badger",
  "Dolphin",
  "Cheetah",
  "Penguin",
  "Owl",
  "Hawk",
  "Rabbit",
  "Tiger",
  "Bear",
] as const;

/**
 * Sanitizes an incoming user display name.
 * Trims whitespace, strips control characters, and clamps to 50 characters.
 */
export function sanitizeDisplayName(rawName?: string | null): string {
  if (!rawName || typeof rawName !== "string") {
    return "";
  }
  // Strip control characters and excessive whitespace
  const sanitized = rawName
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .trim()
    .slice(0, 50);

  return sanitized;
}

/**
 * Generates a random default display name (e.g. "Clever Koala").
 */
export function generateRandomName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

/**
 * Picks a random color from the curated user palette.
 */
export function generateRandomColor(): string {
  return USER_PALETTE[Math.floor(Math.random() * USER_PALETTE.length)];
}

/**
 * Generates user info with sanitized or default name and color.
 */
export function resolveUserInfo(params?: {
  id?: string;
  name?: string | null;
  color?: string | null;
}): UserInfo {
  const id = params?.id && params.id.trim().length > 0 ? params.id.trim() : "";
  const sanitized = sanitizeDisplayName(params?.name);
  const name = sanitized.length > 0 ? sanitized : generateRandomName();

  let color = params?.color && typeof params.color === "string" ? params.color.trim() : "";
  const isValidHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
  if (!isValidHex) {
    color = generateRandomColor();
  }

  return {
    id,
    name,
    color,
  };
}

export const UserInfoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/),
});

export type UserInfo = z.infer<typeof UserInfoSchema>;

export const CursorStateSchema = z.object({
  x: z.number(),
  y: z.number(),
  isDrawing: z.boolean().optional(),
  lastActive: z.number(),
});

export type CursorState = z.infer<typeof CursorStateSchema>;

export const PeerSchema = UserInfoSchema.extend({
  cursor: CursorStateSchema.optional(),
});

export type Peer = z.infer<typeof PeerSchema>;
