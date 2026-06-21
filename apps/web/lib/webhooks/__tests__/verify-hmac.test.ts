import { describe, expect, it } from "vitest";
import {
  computeSupaAdminSignature,
  parseSupaAdminSignature,
  verifySupaAdminSignature,
} from "../verify-hmac";

describe("verifySupaAdminSignature", () => {
  const secret = "test-webhook-secret";
  const payload = JSON.stringify({
    connectionId: "00000000-0000-4000-8000-000000000001",
  });

  it("when signature valid, then returns true", () => {
    const signature = `sha256=${computeSupaAdminSignature(payload, secret)}`;
    expect(verifySupaAdminSignature(payload, secret, signature)).toBe(true);
  });

  it("when signature invalid, then returns false", () => {
    expect(
      verifySupaAdminSignature(payload, secret, `sha256=${"a".repeat(64)}`),
    ).toBe(false);
  });

  it("when header missing prefix, then parse returns null", () => {
    expect(parseSupaAdminSignature("deadbeef")).toBeNull();
  });

  it("when header malformed hex, then parse returns null", () => {
    expect(parseSupaAdminSignature("sha256=not-hex")).toBeNull();
  });
});
