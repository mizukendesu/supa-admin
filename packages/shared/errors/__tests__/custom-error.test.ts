import { describe, expect, it } from "vitest";
import { CustomError, defineDomainError } from "../src";

describe("CustomError", () => {
  it("when constructed, then sets code and metadata", () => {
    const error = new CustomError("boom", {
      code: "test/boom",
      metadata: { id: "1" },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("boom");
    expect(error.code).toBe("test/boom");
    expect(error.metadata).toEqual({ id: "1" });
  });
});

describe("defineDomainError", () => {
  const SampleError = defineDomainError("Sample", "sample-feature");

  it("when notFound called, then returns domain error with metadata", () => {
    const error = SampleError.notFound("abc");

    expect(error).toBeInstanceOf(SampleError);
    expect(error.code).toBe("sample-feature/not-found");
    expect(error.metadata).toEqual({ id: "abc" });
  });

  it("when versionMismatch called, then includes expected and actual", () => {
    const error = SampleError.versionMismatch("abc", 1, 2);

    expect(error.code).toBe("sample-feature/version-mismatch");
    expect(error.metadata).toEqual({ id: "abc", expected: 1, actual: 2 });
  });
});
