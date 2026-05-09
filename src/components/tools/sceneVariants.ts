// ════════════════════════════════════════════════════════════════
// Scene-variant prompt builders
// ════════════════════════════════════════════════════════════════
// Used by MultiSceneWorkspace + WhatsNextWorkspace to generate N
// DELIBERATE prompts instead of asking the model for N random
// variants of the same prompt. Without this each shot looks like
// minor variants of the input — with it the user gets the actual
// "9 different angles" / "8 next moments" the tool's name promises.

/**
 * Cinematic angle / framing variants for `multi-scene`.
 * Returns N prompts in order — pick the slice [0..count].
 */
const MULTI_SCENE_PROMPTS = [
  "wide establishing shot, full scene visible, environmental context",
  "medium shot focused on the subject, balanced framing",
  "close-up of the subject, emphasising detail and expression",
  "low-angle hero shot looking up at the subject, dramatic perspective",
  "high-angle overhead shot looking down, observer perspective",
  "side profile / 3/4 angle of the subject, classical portrait framing",
  "over-the-shoulder reverse angle, framing what the subject sees",
  "back view from behind the subject, mysterious atmosphere",
  "extreme close-up macro detail, intimate framing",
];

/**
 * Narrative progression variants for `whats-next`.
 * Each one moves the scene forward in time / camera / action.
 */
const WHATS_NEXT_PROMPTS = [
  "the very next moment in this scene, 1 second later, subtle motion progression",
  "5 seconds later, the subject has shifted position naturally",
  "the subject turns toward the camera, makes eye contact",
  "the camera pulls back to a wider establishing shot of the same scene",
  "the camera pushes in closer to the subject's face, emotional close-up",
  "a different angle of the same exact moment, side profile",
  "the dramatic next beat: something significant happens to the subject",
  "the resolution moment, the subject's reaction visible",
];

/** Wraps a prompt fragment in a strong directive that tells the
 *  model to PRESERVE identity / lighting / location while changing
 *  the framing or moment. Without this language the edit models
 *  drift the subject's face / clothing / colours between shots. */
function frameDirective(variant: string, kind: "multi-scene" | "whats-next"): string {
  const verb = kind === "multi-scene"
    ? "Recompose this exact image as a"
    : "Continue this exact scene with";
  return [
    `${verb} ${variant}.`,
    "Keep the SAME subject identity, same clothing, same colour palette,",
    "same overall lighting style and mood. This is one of N shots from the",
    "same continuous shoot — they should feel like a coherent series.",
  ].join(" ");
}

export function multiScenePrompts(count: number): string[] {
  return MULTI_SCENE_PROMPTS.slice(0, count).map((v) => frameDirective(v, "multi-scene"));
}

export function whatsNextPrompts(count: number): string[] {
  return WHATS_NEXT_PROMPTS.slice(0, count).map((v) => frameDirective(v, "whats-next"));
}
