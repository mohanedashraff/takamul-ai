// ════════════════════════════════════════════════════════════════
// Aspect ratio coercion — map arbitrary input → nearest supported
// ════════════════════════════════════════════════════════════════
// Every Yilow generator declares a small set of supported aspect
// ratios. SDK / MCP / Canvas callers sometimes pass "1.78", "16x9",
// or "4:3 landscape" by mistake. This helper:
//
//   1. Parses the input loosely.
//   2. Snaps it to the closest supported ratio.
//   3. Returns a structured `adjustments` map so the caller can show
//      the user "we used 16:9 instead of 1.85:1".
//
// Used by /api/generations preprocessing so downstream tools never
// receive a garbage ratio.

export const COMMON_RATIOS = [
  "1:1", "3:4", "4:3", "2:3", "3:2", "9:16", "16:9",
  "5:4", "4:5", "21:9",
] as const;

export type AspectRatio = string;

export interface CoerceResult {
  ratio:       AspectRatio;
  changed:     boolean;
  reason?:     string;
  adjustments: { from: string; to: string; method: "parse" | "snap" }[];
}

/** Parse "1.78", "16x9", "9:16 vertical" → numeric ratio. */
function parseAny(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input) && input > 0) return input;
  if (typeof input !== "string") return null;
  const s = input.trim().toLowerCase();
  // "16:9" or "16x9" form.
  const m = s.match(/(\d+(?:\.\d+)?)[:xX](\d+(?:\.\d+)?)/);
  if (m) {
    const a = parseFloat(m[1]!), b = parseFloat(m[2]!);
    if (a > 0 && b > 0) return a / b;
  }
  // Plain decimal like "1.78".
  const n = parseFloat(s);
  if (Number.isFinite(n) && n > 0) return n;
  return null;
}

function ratioToNum(r: AspectRatio): number {
  const [a, b] = r.split(":").map(Number);
  return (a ?? 0) / (b ?? 1);
}

/** Snap an arbitrary value to the nearest entry in `supported`. */
export function coerceAspectRatio(
  input: unknown,
  supported: readonly AspectRatio[] = COMMON_RATIOS,
  options?: { defaultRatio?: AspectRatio },
): CoerceResult {
  const adjustments: CoerceResult["adjustments"] = [];
  const fallback = options?.defaultRatio ?? supported[0] ?? "16:9";

  // 1. If input is already one of the supported strings → return as-is.
  if (typeof input === "string" && supported.includes(input as AspectRatio)) {
    return { ratio: input, changed: false, adjustments };
  }

  // 2. "auto" gets the default.
  if (input === "auto" || input === undefined || input === null || input === "") {
    return { ratio: fallback, changed: false, adjustments };
  }

  const target = parseAny(input);
  if (target == null) {
    adjustments.push({ from: String(input), to: fallback, method: "parse" });
    return {
      ratio:      fallback,
      changed:    true,
      reason:     `Could not parse "${String(input)}" — defaulting to ${fallback}`,
      adjustments,
    };
  }

  // Snap to nearest by logarithmic distance (so 1:1 ↔ 2:1 ≈ 1:2 ↔ 2:1).
  let best = supported[0]!;
  let bestDist = Infinity;
  for (const r of supported) {
    const d = Math.abs(Math.log(ratioToNum(r) / target));
    if (d < bestDist) { bestDist = d; best = r; }
  }

  const changed = bestDist > 1e-3;
  if (changed) {
    adjustments.push({ from: String(input), to: best, method: "snap" });
  }
  return {
    ratio:      best,
    changed,
    reason:     changed ? `Snapped ${String(input)} → ${best}` : undefined,
    adjustments,
  };
}
