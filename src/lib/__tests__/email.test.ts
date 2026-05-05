import { describe, it, expect } from "vitest";
import { generateToken, hashToken } from "@/lib/email";

describe("email tokens", () => {
  it("generates a 64-char hex token + matching hash", () => {
    const { token, tokenHash } = generateToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(token).not.toBe(tokenHash);
  });

  it("hashToken is deterministic", () => {
    const t = "fixed-input";
    expect(hashToken(t)).toBe(hashToken(t));
  });

  it("hashToken gives a different value for different input", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });

  it("generated tokenHash matches hashToken(token)", () => {
    const { token, tokenHash } = generateToken();
    expect(hashToken(token)).toBe(tokenHash);
  });
});
