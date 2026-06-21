import { beforeEach, describe, expect, it, vi } from "vitest";
import { getShellData } from "../src/get-shell-data";

vi.mock("@supa-admin/feature-connections", () => ({
  listAccessibleConnections: vi.fn(),
}));

import { listAccessibleConnections } from "@supa-admin/feature-connections";

const mockListAccessibleConnections = vi.mocked(listAccessibleConnections);

describe("getShellData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns profile and connection summaries sorted by name", async () => {
    mockListAccessibleConnections.mockResolvedValue([
      {
        id: "conn-2",
        name: "Beta",
        url: "http://beta",
        schema_cached_at: null,
        bootstrap_status: "pending",
        bootstrap_verified_at: null,
        created_by: null,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "conn-1",
        name: "Alpha",
        url: "http://alpha",
        schema_cached_at: null,
        bootstrap_status: "ready",
        bootstrap_verified_at: null,
        created_by: null,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
    ]);

    const result = await getShellData({
      id: "user-1",
      email: "admin@example.com",
      display_name: "Admin",
      role: "platform_admin",
      created_at: "2024-01-01T00:00:00.000Z",
    });

    expect(mockListAccessibleConnections).toHaveBeenCalledWith(
      "user-1",
      "platform_admin",
    );
    expect(result.profile.email).toBe("admin@example.com");
    expect(result.connections).toEqual([
      { id: "conn-1", name: "Alpha" },
      { id: "conn-2", name: "Beta" },
    ]);
  });

  it("returns empty connections when none are accessible", async () => {
    mockListAccessibleConnections.mockResolvedValue([]);

    const result = await getShellData({
      id: "user-2",
      email: "member@example.com",
      display_name: null,
      role: "member",
      created_at: "2024-01-01T00:00:00.000Z",
    });

    expect(result.connections).toEqual([]);
  });
});
