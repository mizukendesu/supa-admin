import { describe, expect, it } from "vitest";
import { defineDomainError, defineReferenceGuardError } from "../src";

class _SampleBase extends defineDomainError("Sample", "sample-feature") {}

const SampleReferenceError = defineReferenceGuardError(_SampleBase, "parent");

describe("defineReferenceGuardError", () => {
  it("when constructed, then includes reference metadata", () => {
    const error = new SampleReferenceError("parent-1");

    expect(error).toBeInstanceOf(_SampleBase);
    expect(error.code).toBe("sample-feature/reference-guard");
    expect(error.metadata).toEqual({
      referenceName: "parent",
      referencedId: "parent-1",
    });
  });
});

describe("defineDomainError", () => {
  const SampleError = defineDomainError("Sample", "sample-feature");

  it("when alreadyDeleted called, then returns typed error", () => {
    const error = SampleError.alreadyDeleted("id-1");
    expect(error.code).toBe("sample-feature/already-deleted");
  });

  it("when insertFailed called, then returns typed error", () => {
    const error = SampleError.insertFailed();
    expect(error.code).toBe("sample-feature/insert-failed");
  });
});
