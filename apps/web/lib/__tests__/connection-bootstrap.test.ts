import { mockSupabaseQuery } from "@supa-admin/vitest-config/supabase-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockServiceFrom = vi.fn();

vi.mock("@supa-admin/auth/server", () => ({
  createMetaServiceClient: vi.fn(() => ({ from: mockServiceFrom })),
}));

describe("getConnectionBootstrapStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when connection exists, then returns status", async () => {
    mockServiceFrom.mockReturnValue(
      mockSupabaseQuery({
        data: { bootstrap_status: "ready" },
        error: null,
      }),
    );
    const { getConnectionBootstrapStatus } = await import(
      "../connection-bootstrap.js"
    );
    await expect(getConnectionBootstrapStatus("conn-1")).resolves.toBe("ready");
  });

  it("when connection missing, then returns null", async () => {
    mockServiceFrom.mockReturnValue(
      mockSupabaseQuery({ data: null, error: { message: "not found" } }),
    );
    const { getConnectionBootstrapStatus } = await import(
      "../connection-bootstrap.js"
    );
    await expect(getConnectionBootstrapStatus("conn-1")).resolves.toBeNull();
  });
});

describe("requireConnectionBootstrapReady", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when status is pending, then throws", async () => {
    mockServiceFrom.mockReturnValue(
      mockSupabaseQuery({
        data: { bootstrap_status: "pending" },
        error: null,
      }),
    );
    const { requireConnectionBootstrapReady } = await import(
      "../connection-bootstrap.js"
    );
    await expect(requireConnectionBootstrapReady("conn-1")).rejects.toThrow(
      "Target bootstrap is not complete",
    );
  });
});
