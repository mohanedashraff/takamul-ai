import { describe, it, expect } from "vitest";
import { buildCinemaPrompt, CAMERAS, LENSES, APERTURES } from "@/lib/data/cinema";

describe("buildCinemaPrompt", () => {
  it("includes the base prompt + camera + lens + focal + aperture", () => {
    // Pick non-"Auto" presets — Cinema 3.5 puts Auto at index 0 for every
    // catalog, and Auto descriptors are empty by design (the backend "lets
    // the model choose"). Use the next entry instead so we can assert the
    // descriptor is stitched in.
    const realCamera   = CAMERAS.find((c)   => !c.isAuto)!;
    const realLens     = LENSES.find((l)    => !l.isAuto)!;
    const realAperture = APERTURES.find((a) => a.id !== "auto")!;

    const out = buildCinemaPrompt({
      basePrompt: "A red sports car on a desert road",
      cameraId:   realCamera.id,
      lensId:     realLens.id,
      focal:      35,
      apertureId: realAperture.id,
    });

    expect(out).toContain("A red sports car on a desert road");
    expect(out).toContain(realCamera.descriptor);
    expect(out).toContain(realLens.descriptor);
    expect(out).toContain("35mm");
    expect(out).toContain(realAperture.descriptor);
    expect(out).toContain("8K resolution"); // standard cinematic suffix
  });

  it("skips camera/lens/aperture descriptors when set to Auto", () => {
    const out = buildCinemaPrompt({
      basePrompt: "X",
      cameraId:   "auto",
      lensId:     "auto",
      focal:      35,
      apertureId: "auto",
      genreId:    "noir", // explicit — matches the reference snapshot default
    });
    // Auto camera → no "shot on..." fragment
    expect(out).not.toContain("shot on");
    // Auto aperture → no "aperture..." fragment
    expect(out).not.toContain("aperture ");
    // Focal is always injected (no Auto state for focal in our UI)
    expect(out).toContain("35mm");
    // Genre is honoured — noir descriptor lands in the prompt
    expect(out).toContain("film noir");
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
