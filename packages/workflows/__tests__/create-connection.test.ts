import { ok } from "@supa-admin/ddd";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createConnectionWorkflow } from "../src/create-connection";

vi.mock("@supa-admin/feature-connections", () => ({
  createConnection: vi.fn(),
}));

import { createConnection } from "@supa-admin/feature-connections";

const mockCreateConnection = vi.mocked(createConnection);

describe("createConnectionWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to feature-connections createConnection", async () => {
    mockCreateConnection.mockResolvedValue(
      ok({
        connection: {
          id: "conn-1",
          name: "Demo",
          url: "http://demo",
          anon_key_enc: "enc-anon",
          service_role_enc: "enc-service",
          schema_cached_at: null,
          bootstrap_status: "pending",
          bootstrap_verified_at: null,
          created_by: "user-1",
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
        },
        tableCount: 2,
      }),
    );

    const input = {
      name: "Demo",
      url: "http://demo",
      anonKey: "anon",
      serviceRoleKey: "service",
      createdBy: "user-1",
    };

    const result = await createConnectionWorkflow(input);

    expect(mockCreateConnection).toHaveBeenCalledWith(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.tableCount).toBe(2);
  });
});
