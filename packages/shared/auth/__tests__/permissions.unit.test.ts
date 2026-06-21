import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockIsSetupComplete = vi.fn();

vi.mock("@supa-admin/feature-setup", () => ({
  isSetupComplete: () => mockIsSetupComplete(),
}));

describe("isSetupComplete", () => {
  it("when setup_complete is true, then returns true", async () => {
    mockIsSetupComplete.mockResolvedValue(true);

    const { isSetupComplete } = await import("../src/permissions.js");
    await expect(isSetupComplete()).resolves.toBe(true);
  });

  it("when setup_complete is false string, then returns false", async () => {
    mockIsSetupComplete.mockResolvedValue(false);

    const { isSetupComplete } = await import("../src/permissions.js");
    await expect(isSetupComplete()).resolves.toBe(false);
  });
});
