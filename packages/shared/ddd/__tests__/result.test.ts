import { describe, expect, it } from "vitest";
import { err, isErr, isOk, map, mapErr, ok, unwrap } from "../src/result";

describe("Result", () => {
  it("when ok, then isOk is true and value is accessible", () => {
    const result = ok(42);
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
    expect(result.value).toBe(42);
  });

  it("when err, then isErr is true and error is accessible", () => {
    const result = err("failed");
    expect(isErr(result)).toBe(true);
    expect(isOk(result)).toBe(false);
    expect(result.error).toBe("failed");
  });

  it("when unwrap on ok, then returns value", () => {
    expect(unwrap(ok("value"))).toBe("value");
  });

  it("when unwrap on err, then throws error", () => {
    expect(() => unwrap(err(new Error("boom")))).toThrow("boom");
  });

  it("when map on ok, then transforms value", () => {
    const result = map(ok(2), (n) => n * 2);
    expect(result).toEqual(ok(4));
  });

  it("when mapErr on err, then transforms error", () => {
    const result = mapErr(err("bad"), (e) => `${e}!`);
    expect(result).toEqual(err("bad!"));
  });
});
