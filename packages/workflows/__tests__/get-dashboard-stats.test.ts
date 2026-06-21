import { describe, expect, it, vi } from "vitest";
import { getDashboardStatsWorkflow } from "../src/get-dashboard-stats";

vi.mock("server-only", () => ({}));

vi.mock("@supa-admin/repository-kit", () => ({
  createDbContext: vi.fn(async () => ({ db: {}, mode: "service" })),
  createUsersRepository: vi.fn(() => ({
    listProfiles: vi.fn().mockResolvedValue([{ id: "1" }, { id: "2" }]),
  })),
  createAccessRepository: vi.fn(() => ({
    listRoles: vi.fn().mockResolvedValue([{ id: "r1" }]),
  })),
}));

describe("getDashboardStatsWorkflow", () => {
  it("returns user and role counts", async () => {
    const result = await getDashboardStatsWorkflow();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ userCount: 2, roleCount: 1 });
    }
  });
});
