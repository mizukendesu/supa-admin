import { describe, expect, it } from "vitest";
import { SetupLock } from "../src/domain/setup-lock";

describe("SetupLock", () => {
  it("when value is false, then lock can be acquired", () => {
    expect(SetupLock.canAcquireLock(false)).toBe(true);
  });

  it("when value is in_progress object, then reports in progress", () => {
    expect(SetupLock.isInProgress({ status: "in_progress" })).toBe(true);
  });

  it("when value is true, then setup is complete", () => {
    expect(SetupLock.isComplete(true)).toBe(true);
    expect(SetupLock.isComplete("true")).toBe(true);
  });

  it("when value is false, then setup is not complete", () => {
    expect(SetupLock.isComplete(false)).toBe(false);
  });
});
