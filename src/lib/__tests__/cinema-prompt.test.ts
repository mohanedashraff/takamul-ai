import { describe, it, expect } from "vitest";
import { buildCinemaPrompt, CAMERAS, LENSES, APERTURES } from "@/lib/data/cinema";

describe("buildCinemaPrompt", () => {
  it("includes the base prompt + camera + lens + focal + aperture", () => {
    const out = buildCinemaPrompt({
      basePrompt: "A red sports car on a desert road",
      cameraId:   CAMERAS[0]!.id,
      lensId:     LENSES[0]!.id,
      focal:      35,
      apertureId: APERTURES[0]!.id,
    });

    expect(out).toContain("A red sports car on a desert road");
    expect(out).toContain(CAMERAS[0]!.descriptor);
    expect(out).toContain(LENSES[0]!.descriptor);
    expect(out).toContain("35mm");
    expect(out).toContain(APERTURES[0]!.descriptor);
    expect(out).toContain("8K resolution"); // standard cinematic suffix
  });

  it("falls back to defaults for unknown ids", () => {
    const out = buildCinemaPrompt({
      basePrompt: "X",
      cameraId:   "not-a-real-camera",
      lensId:     "not-a-real-lens",
      focal:      9999, // not in the FOCAL_LENGTHS list
      apertureId: "f/0",
    });
    // It should still produce SOMETHING useful instead of throwing.
    expect(out.length).toBeGreaterThan(20);
  });
});
