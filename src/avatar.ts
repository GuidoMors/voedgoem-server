// An avatar is a body, a face and a hat, each with its own colour. The part ids refer to
// the artwork bundled with the frontend; the server only checks their shape so adding
// artwork never needs a server change.
export interface Avatar {
  body: string;
  bodyColor: string;
  face: string;
  faceColor: string;
  hat: string;
  hatColor: string;
}

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

const KEYS = ["body", "bodyColor", "face", "faceColor", "hat", "hatColor"] as const;

export function parseAvatar(value: unknown): Avatar | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of KEYS) {
    const field = input[key];
    const isColor = key.endsWith("Color");
    if (typeof field !== "string" || !(isColor ? COLOR_PATTERN : ID_PATTERN).test(field)) return null;
    out[key] = isColor ? field.toLowerCase() : field;
  }
  return out as unknown as Avatar;
}

// Reads an avatar stored as JSON text, tolerating a missing or damaged value.
export function parseStoredAvatar(raw: string | null | undefined): Avatar | null {
  if (!raw) return null;
  try {
    return parseAvatar(JSON.parse(raw));
  } catch {
    return null;
  }
}
