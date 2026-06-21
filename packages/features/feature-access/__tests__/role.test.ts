import { describe, expect, it } from "vitest";
import { Role } from "../src/domain/role";
import { AccessFeatureError } from "../src/errors";

describe("Role", () => {
  it("when name is valid, then creates aggregate", () => {
    const role = new Role("role-1", "Editor", "Can edit content");
    expect(role.name).toBe("Editor");
    expect(role.description).toBe("Can edit content");
  });

  it("when name is blank, then throws invalid state", () => {
    expect(() => new Role("role-1", "   ", null)).toThrow(AccessFeatureError);
  });

  it("when validateCreateInput called with whitespace, then throws", () => {
    expect(() => Role.validateCreateInput("  ")).toThrow(AccessFeatureError);
  });

  it("when validateCreateInput called, then trims name", () => {
    expect(Role.validateCreateInput("  Admin  ")).toBe("Admin");
  });
});
