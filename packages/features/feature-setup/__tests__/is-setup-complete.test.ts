import { describe, expect, it } from "vitest";
import { SetupLock } from "../src/domain/setup-lock";

describe("isSetupComplete parsing", () => {
  it("when value is false string, then setup is not complete", () => {
    expect(SetupLock.isComplete("false")).toBe(false);
  });

  it("when value is true string, then setup is complete", () => {
    expect(SetupLock.isComplete("true")).toBe(true);
  });
});
