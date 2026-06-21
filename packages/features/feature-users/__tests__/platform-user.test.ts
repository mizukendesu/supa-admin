import { describe, expect, it } from "vitest";
import { PlatformUser } from "../src/domain/platform-user";
import { UsersFeatureError } from "../src/errors";

describe("PlatformUser", () => {
  it("when valid email, then creates aggregate", () => {
    const user = new PlatformUser(
      "user-1",
      "admin@example.com",
      "Admin",
      "platform_admin",
    );
    expect(user.email).toBe("admin@example.com");
    expect(user.role).toBe("platform_admin");
  });

  it("when email blank, then throws", () => {
    expect(() => new PlatformUser("user-1", "  ", null, "member")).toThrow(
      UsersFeatureError,
    );
  });

  it("when validateEmail called, then trims", () => {
    expect(PlatformUser.validateEmail("  a@b.com  ")).toBe("a@b.com");
  });
});
