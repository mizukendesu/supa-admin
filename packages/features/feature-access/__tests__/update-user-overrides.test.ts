import { describe, expect, it, vi } from "vitest";
import { updateUserOverrides } from "../src/application/update-user-overrides";

vi.mock("server-only", () => ({}));

const mockReplace = vi.fn();

vi.mock("@supa-admin/repository-kit", () => ({
  createDbContext: vi.fn(async () => ({ db: {}, mode: "service" })),
  createAccessRepository: vi.fn(() => ({
    replaceUserPermissionOverrides: mockReplace,
  })),
}));

describe("updateUserOverrides", () => {
  it("when overrides provided, then persists via repository", async () => {
    mockReplace.mockResolvedValue(undefined);

    const result = await updateUserOverrides("user-1", "conn-1", [
      {
        table_name: "posts",
        can_read: true,
        can_create: null,
        can_update: null,
        can_delete: false,
      },
    ]);

    expect(result.ok).toBe(true);
    expect(mockReplace).toHaveBeenCalledWith("user-1", "conn-1", [
      expect.objectContaining({ table_name: "posts", can_read: true }),
    ]);
  });
});
