// ════════════════════════════════════════════════════════════════
// Shared types for the Soul 2.0 studio components
// ════════════════════════════════════════════════════════════════

// Server row shapes (mirror Prisma but trimmed to what the UI needs).
export interface SoulMoodboardRow {
  id:          string;
  name:        string;
  description: string | null;
  imageUrls:   string[];
  thumbnail:   string | null;
  descriptor:  string | null;
  createdAt:   string;
}

export interface SoulCharacterRow {
  id:        string;
  name:      string;
  variant:   string;
  hintText:  string | null;
  imageUrls: string[];
  thumbnail: string | null;
  trained:   boolean;
  createdAt: string;
}

// The full state of the Soul shoot bar — single source of truth.
export interface SoulConfig {
  prompt:        string;
  // moodboardId is either a curated id (e.g. "y2k-studio") OR a user
  // moodboard row id. Components disambiguate by checking against the
  // curated catalog.
  moodboardId:   string;
  paletteId:     string;             // "" means no palette selected
  characterId:   string | null;
  aspect:        string;             // matches SOUL_ASPECTS
  quality:       string;              // matches SOUL_QUALITIES
  variations:    number;              // 1-4
  enhancePrompt: boolean;
  // One-off Soul Reference image attached via the [+] on the prompt
  // bar (image-to-image guidance for a single generation).
  referenceUrl:  string | null;
  // When the user uploaded a custom Soul HEX palette, the extracted
  // HEX strings live here and override `paletteId`.
  customPaletteHexes: string[] | null;
}

export interface SoulShot {
  id:        string;
  /** Server-side generation id (Generation.id) so we can update the
   *  history row when the user refines or deletes the shot. Optional
   *  because v1 history rows didn't have it. */
  generationId?: string;
  url:       string;
  /** When set, this shot has been run through the Refiner (upscaler).
   *  `url` is the refined version, `originalUrl` keeps the pre-refine
   *  reference so we can render a "Show original" toggle later. */
  originalUrl?: string;
  refined?:     boolean;
  timestamp: number;
  prompt:    string;
  config:    SoulConfig;
}
