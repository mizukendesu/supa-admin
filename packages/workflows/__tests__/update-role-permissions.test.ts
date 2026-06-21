import { ok } from "@supa-admin/ddd";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateRolePermissionsWorkflow } from "../src/update-role-permissions";

vi.mock("@supa-admin/feature-access", () => ({
  updateRolePermissions: vi.fn(),
}));

vi.mock("@supa-admin/rls", () => ({
  executeRlsSync: vi.fn(),
}));

vi.mock("../src/internal/connection-credentials", () => ({
  loadConnectionCredentials: vi.fn(),
}));

import { updateRolePermissions } from "@supa-admin/feature-access";
import { executeRlsSync } from "@supa-admin/rls";
import { loadConnectionCredentials } from "../src/internal/connection-credentials";

const mockUpdateRolePermissions = vi.mocked(updateRolePermissions);
const mockExecuteRlsSync = vi.mocked(executeRlsSync);
const mockLoadConnectionCredentials = vi.mocked(loadConnectionCredentials);

describe("updateRolePermissionsWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs RLS sync when bootstrap is ready", async () => {
    mockUpdateRolePermissions.mockResolvedValue(ok({ success: true }));
    mockLoadConnectionCredentials.mockResolvedValue({
      url: "http://demo",
      serviceRoleEnc: "enc-service",
      bootstrapStatus: "ready",
    });
    mockExecuteRlsSync.mockResolvedValue({ success: true, sql: "SELECT 1" });

    const result = await updateRolePermissionsWorkflow({
      roleId: "role-1",
      connectionId: "conn-1",
      permissions: [],
      executedBy: "admin-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.rlsSync).toEqual({ success: true });
    expect(mockExecuteRlsSync).toHaveBeenCalledWith(
      "conn-1",
      "http://demo",
      "enc-service",
      "admin-1",
    );
  });

  it("skips RLS sync when bootstrap is not ready", async () => {
    mockUpdateRolePermissions.mockResolvedValue(ok({ success: true }));
    mockLoadConnectionCredentials.mockResolvedValue({
      url: "http://demo",
      serviceRoleEnc: "enc-service",
      bootstrapStatus: "pending",
    });

    const result = await updateRolePermissionsWorkflow({
      roleId: "role-1",
      connectionId: "conn-1",
      permissions: [],
      executedBy: "admin-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.rlsSync).toEqual({
      success: false,
      error: "Target bootstrap is not complete",
    });
    expect(mockExecuteRlsSync).not.toHaveBeenCalled();
  });
});
