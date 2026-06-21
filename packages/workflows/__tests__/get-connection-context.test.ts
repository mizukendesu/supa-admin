import { err, ok } from "@supa-admin/ddd";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getConnectionContext } from "../src/get-connection-context";

vi.mock("@supa-admin/feature-access", () => ({
  resolveUserPermissions: vi.fn(),
}));

vi.mock("@supa-admin/feature-connections", () => ({
  getAccessibleConnection: vi.fn(),
}));

import { resolveUserPermissions } from "@supa-admin/feature-access";
import { getAccessibleConnection } from "@supa-admin/feature-connections";

const mockResolveUserPermissions = vi.mocked(resolveUserPermissions);
const mockGetAccessibleConnection = vi.mocked(getAccessibleConnection);

describe("getConnectionContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("combines accessible connection data with resolved permissions", async () => {
    mockGetAccessibleConnection.mockResolvedValue(
      ok({
        connection: {
          id: "conn-1",
          name: "Demo",
          url: "http://demo",
          bootstrap_status: "ready",
        },
        tables: [
          {
            id: "tbl-1",
            connection_id: "conn-1",
            table_name: "posts",
            columns: [],
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-01T00:00:00.000Z",
          },
        ],
      }),
    );
    mockResolveUserPermissions.mockResolvedValue([
      {
        connection_id: "conn-1",
        table_name: "posts",
        can_read: true,
        can_create: false,
        can_update: false,
        can_delete: false,
      },
    ]);

    const result = await getConnectionContext("conn-1", "user-1", "member");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.connection.name).toBe("Demo");
    expect(result.value.tables).toHaveLength(1);
    expect(result.value.permissions[0]?.can_read).toBe(true);
  });

  it("propagates access errors from feature-connections", async () => {
    mockGetAccessibleConnection.mockResolvedValue(err(new Error("Forbidden")));

    const result = await getConnectionContext("conn-1", "user-1", "member");

    expect(result.ok).toBe(false);
    expect(mockResolveUserPermissions).not.toHaveBeenCalled();
  });
});
