import { ok } from "@supa-admin/ddd";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminCallContext, callWithInput, TEST_IDS } from "./helpers.js";

vi.mock("server-only", () => ({}));

vi.mock("@supa-admin/feature-setup", () => ({
  isSetupComplete: vi.fn(),
  createAdmin: vi.fn(),
}));

vi.mock("@supa-admin/feature-connections", () => ({
  listConnections: vi.fn(),
  createConnection: vi.fn(),
  getConnection: vi.fn(),
  deleteConnection: vi.fn(),
  listAccessibleConnections: vi.fn(),
  getAccessibleConnection: vi.fn(),
  getAnonKey: vi.fn(),
  bootstrapProbe: vi.fn(),
  bootstrapApply: vi.fn(),
  bootstrapVerify: vi.fn(),
  rotateWebhookSecret: vi.fn(),
  revealWebhookSecret: vi.fn(),
  previewConnectionRls: vi.fn(),
  applyConnectionRls: vi.fn(),
}));

vi.mock("@supa-admin/feature-access", () => ({
  listRoles: vi.fn(),
  createRole: vi.fn(),
  getRolePermissions: vi.fn(),
  getUserConnectionIds: vi.fn(),
  updateUserOverrides: vi.fn(),
  getUserOverrides: vi.fn(),
}));

vi.mock("@supa-admin/feature-users", () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("@supa-admin/workflows", () => ({
  createConnectionWorkflow: vi.fn(),
  syncConnectionSchemaWorkflow: vi.fn(),
  updateRolePermissionsWorkflow: vi.fn(),
  provisionTargetUserWorkflow: vi.fn(),
  getShellData: vi.fn(),
  completeOnboarding: vi.fn(),
  syncTargetSession: vi.fn(),
  getDashboardStatsWorkflow: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    SETUP_SECRET:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  },
}));

vi.mock("@supa-admin/auth/permissions", () => ({
  getCurrentProfile: vi.fn().mockResolvedValue({
    id: TEST_IDS.user,
    role: "platform_admin",
  }),
  requirePlatformAdmin: vi.fn().mockResolvedValue({
    id: TEST_IDS.user,
    role: "platform_admin",
  }),
}));

const adminCtx = adminCallContext();

describe("accessHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getUserOverrides returns overrides from feature use case", async () => {
    const { getUserOverrides } = await import("@supa-admin/feature-access");
    vi.mocked(getUserOverrides).mockResolvedValue(
      ok({
        overrides: [
          {
            table_name: "posts",
            can_read: true,
            can_create: null,
            can_update: null,
            can_delete: null,
          },
        ],
        rolePermissions: [],
      }),
    );

    const { accessHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      accessHandlers.getUserOverrides,
      { userId: TEST_IDS.user, connectionId: TEST_IDS.connection },
      { context: adminCtx },
    );

    expect(result.overrides).toHaveLength(1);
    expect(result.overrides[0]?.table_name).toBe("posts");
  });

  it("updateUserOverrides delegates to feature use case", async () => {
    const { updateUserOverrides } = await import("@supa-admin/feature-access");
    vi.mocked(updateUserOverrides).mockResolvedValue(
      ok({ success: true as const }),
    );

    const { accessHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      accessHandlers.updateUserOverrides,
      {
        userId: TEST_IDS.user,
        connectionId: TEST_IDS.connection,
        overrides: [
          {
            table_name: "posts",
            can_read: true,
            can_create: false,
            can_update: false,
            can_delete: false,
          },
        ],
      },
      { context: adminCtx },
    );

    expect(result).toEqual({ success: true });
    expect(updateUserOverrides).toHaveBeenCalledWith(
      TEST_IDS.user,
      TEST_IDS.connection,
      expect.arrayContaining([
        expect.objectContaining({ table_name: "posts", can_read: true }),
      ]),
    );
  });
});
