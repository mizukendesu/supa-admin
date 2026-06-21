import { ok } from "@supa-admin/ddd";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncConnectionSchemaWorkflow } from "../src/sync-connection-schema";

vi.mock("@supa-admin/feature-connections", () => ({
  syncConnectionSchema: vi.fn(),
}));

import { syncConnectionSchema } from "@supa-admin/feature-connections";

const mockSyncConnectionSchema = vi.mocked(syncConnectionSchema);

describe("syncConnectionSchemaWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to feature-connections syncConnectionSchema", async () => {
    mockSyncConnectionSchema.mockResolvedValue(
      ok({ success: true, tableCount: 3 }),
    );

    const result = await syncConnectionSchemaWorkflow("conn-1");

    expect(mockSyncConnectionSchema).toHaveBeenCalledWith("conn-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.tableCount).toBe(3);
  });
});
