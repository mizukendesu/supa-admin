import { err, ok } from "@supa-admin/ddd";
import { CustomError } from "@supa-admin/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminCallContext,
  callWithInput,
  SETUP_SECRET,
  TEST_IDS,
} from "./helpers.js";

vi.mock("server-only", () => ({}));

vi.mock("@supa-admin/feature-setup", () => ({
  isSetupComplete: vi.fn().mockResolvedValue(false),
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
  getUserConnectionIds: vi.fn().mockResolvedValue([TEST_IDS.connection]),
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
  getUserConnectionIds: vi.fn().mockResolvedValue([TEST_IDS.connection]),
}));

const adminCtx = adminCallContext();

describe("setupHandlers.createAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when lock acquired, then creates admin user", async () => {
    const { createAdmin } = await import("@supa-admin/feature-setup");
    vi.mocked(createAdmin).mockResolvedValue(ok({ success: true as const }));

    const { setupHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      setupHandlers.createAdmin,
      {
        email: "admin@example.com",
        password: "password123",
        displayName: "Admin",
        setupSecret: SETUP_SECRET,
      },
      { context: { actorId: null, clientIp: "127.0.0.1" } },
    );
    expect(result).toEqual({ success: true });
  });
});

describe("connectionsHandlers.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when valid input, then creates connection", async () => {
    const { createConnectionWorkflow } = await import("@supa-admin/workflows");
    vi.mocked(createConnectionWorkflow).mockResolvedValue(
      ok({
        connection: {
          id: TEST_IDS.connection,
          name: "Test",
          url: "https://example.supabase.co",
          schema_cached_at: null,
          bootstrap_status: "ready",
          bootstrap_verified_at: "2024-01-01T00:00:00Z",
          anon_key_enc: "enc",
          service_role_enc: "enc",
          webhook_secret_enc: "enc",
          created_by: TEST_IDS.user,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
        tableCount: 1,
      }),
    );

    const { connectionsHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      connectionsHandlers.create,
      {
        name: "Test",
        url: "https://example.supabase.co/",
        anonKey: "anon",
        serviceRoleKey: "service",
      },
      { context: adminCtx },
    );
    expect(result.connection.id).toBe(TEST_IDS.connection);
    expect(result.tableCount).toBe(1);
  });
});

describe("connectionsHandlers.schemaSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when connection exists, then syncs schema", async () => {
    const { syncConnectionSchemaWorkflow } = await import(
      "@supa-admin/workflows"
    );
    vi.mocked(syncConnectionSchemaWorkflow).mockResolvedValue(
      ok({ success: true as const, tableCount: 1 }),
    );

    const { connectionsHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      connectionsHandlers.schemaSync,
      { id: TEST_IDS.connection },
      { context: adminCtx },
    );
    expect(result).toEqual({ success: true, tableCount: 1 });
  });
});

describe("rolesHandlers.updatePermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when permissions provided, then replaces role permissions", async () => {
    const { updateRolePermissionsWorkflow } = await import(
      "@supa-admin/workflows"
    );
    vi.mocked(updateRolePermissionsWorkflow).mockResolvedValue(
      ok({
        success: true as const,
        rlsSync: { success: true },
      }),
    );

    const { rolesHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      rolesHandlers.updatePermissions,
      {
        roleId: TEST_IDS.role,
        connectionId: TEST_IDS.connection,
        permissions: [
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
    expect(result).toEqual({
      success: true,
      rlsSync: { success: true },
    });
  });

  it("when bootstrap pending, then skips rls sync", async () => {
    const { updateRolePermissionsWorkflow } = await import(
      "@supa-admin/workflows"
    );
    vi.mocked(updateRolePermissionsWorkflow).mockResolvedValue(
      ok({
        success: true as const,
        rlsSync: {
          success: false,
          error: "Target bootstrap is not complete",
        },
      }),
    );

    const { rolesHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      rolesHandlers.updatePermissions,
      {
        roleId: TEST_IDS.role,
        connectionId: TEST_IDS.connection,
        permissions: [
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
    expect(result).toEqual({
      success: true,
      rlsSync: {
        success: false,
        error: "Target bootstrap is not complete",
      },
    });
  });
});

describe("usersHandlers.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when valid input, then creates user", async () => {
    const { createUser } = await import("@supa-admin/feature-users");
    vi.mocked(createUser).mockResolvedValue(
      ok({
        user: {
          id: "00000000-0000-4000-8000-000000000010",
          email: "user@example.com",
        },
      }),
    );

    const { usersHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      usersHandlers.create,
      {
        email: "user@example.com",
        password: "password123",
        displayName: "User",
        role: "member",
      },
      { context: adminCtx },
    );
    expect(result.user.email).toBe("user@example.com");
  });
});

describe("provisionHandlers.createUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when connection exists, then provisions target user", async () => {
    const { provisionTargetUserWorkflow } = await import(
      "@supa-admin/workflows"
    );
    vi.mocked(provisionTargetUserWorkflow).mockResolvedValue(
      ok({ success: true as const, targetUserId: TEST_IDS.targetUser }),
    );

    const { provisionHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      provisionHandlers.createUser,
      {
        connectionId: TEST_IDS.connection,
        userId: TEST_IDS.user,
        email: "target@example.com",
        password: "password123",
      },
      { context: adminCtx },
    );
    expect(result.success).toBe(true);
    expect(result.targetUserId).toBe(TEST_IDS.targetUser);
  });

  it("when bootstrap pending, then throws PRECONDITION_FAILED", async () => {
    const { provisionTargetUserWorkflow } = await import(
      "@supa-admin/workflows"
    );
    vi.mocked(provisionTargetUserWorkflow).mockResolvedValue(
      err(
        new CustomError("Target bootstrap is not complete", {
          code: "feature-users/precondition-failed",
        }),
      ),
    );

    const { provisionHandlers } = await import("../handlers/index.js");
    await expect(
      callWithInput(
        provisionHandlers.createUser,
        {
          connectionId: TEST_IDS.connection,
          userId: TEST_IDS.user,
          email: "target@example.com",
          password: "password123",
        },
        { context: adminCtx },
      ),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});

describe("connectionsRlsHandlers.apply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when sync succeeds, then returns success", async () => {
    const { applyConnectionRls } = await import(
      "@supa-admin/feature-connections"
    );
    vi.mocked(applyConnectionRls).mockResolvedValue({
      success: true as const,
      sql: "-- sql",
    });

    const { connectionsRlsHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      connectionsRlsHandlers.apply,
      { id: TEST_IDS.connection },
      { context: adminCtx },
    );
    expect(result.success).toBe(true);
  });

  it("when bootstrap pending, then throws PRECONDITION_FAILED", async () => {
    const { applyConnectionRls } = await import(
      "@supa-admin/feature-connections"
    );
    vi.mocked(applyConnectionRls).mockRejectedValue(
      new CustomError("Target bootstrap is not complete", {
        code: "feature-connections/precondition-failed",
      }),
    );

    const { connectionsRlsHandlers } = await import("../handlers/index.js");
    await expect(
      callWithInput(
        connectionsRlsHandlers.apply,
        { id: TEST_IDS.connection },
        { context: adminCtx },
      ),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});

describe("connectionsHandlers.bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when probe ready, then returns ready status", async () => {
    const { bootstrapProbe } = await import("@supa-admin/feature-connections");
    vi.mocked(bootstrapProbe).mockResolvedValueOnce({ status: "ready" });

    const { connectionsHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      connectionsHandlers.bootstrap.probe,
      { id: TEST_IDS.connection },
      { context: adminCtx },
    );
    expect(result).toEqual({ status: "ready" });
  });

  it("when probe pending, then returns setup SQL", async () => {
    const { bootstrapProbe } = await import("@supa-admin/feature-connections");
    vi.mocked(bootstrapProbe).mockResolvedValueOnce({
      status: "pending",
      setupSql: "-- setup",
    });

    const { connectionsHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      connectionsHandlers.bootstrap.probe,
      { id: TEST_IDS.connection },
      { context: adminCtx },
    );
    expect(result).toEqual({ status: "pending", setupSql: "-- setup" });
  });

  it("when apply succeeds, then returns ready", async () => {
    const { bootstrapApply } = await import("@supa-admin/feature-connections");
    vi.mocked(bootstrapApply).mockResolvedValueOnce({
      success: true as const,
      status: "ready" as const,
    });

    const { connectionsHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      connectionsHandlers.bootstrap.apply,
      { id: TEST_IDS.connection },
      { context: adminCtx },
    );
    expect(result).toEqual({ success: true, status: "ready" });
  });

  it("when verify fails, then throws BAD_REQUEST with setup SQL", async () => {
    const { bootstrapVerify } = await import("@supa-admin/feature-connections");
    vi.mocked(bootstrapVerify).mockRejectedValueOnce(
      new CustomError("exec_sql not found", {
        metadata: { setupSql: "-- manual setup" },
      }),
    );

    const { connectionsHandlers } = await import("../handlers/index.js");
    await expect(
      callWithInput(
        connectionsHandlers.bootstrap.verify,
        { id: TEST_IDS.connection },
        { context: adminCtx },
      ),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      data: { setupSql: "-- manual setup" },
    });
  });
});

describe("connectionsHandlers.target.syncPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when bootstrap ready, then syncs permissions", async () => {
    const { syncTargetSession } = await import("@supa-admin/workflows");
    vi.mocked(syncTargetSession).mockResolvedValue(
      ok({
        success: true,
        targetUserId: TEST_IDS.targetUser,
      }),
    );

    const { connectionsHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      connectionsHandlers.target.syncPermissions,
      {
        connectionId: TEST_IDS.connection,
        targetEmail: "target@example.com",
      },
      { context: adminCtx },
    );
    expect(result).toEqual({
      success: true,
      targetUserId: TEST_IDS.targetUser,
    });
  });

  it("when bootstrap pending, then throws PRECONDITION_FAILED", async () => {
    const { syncTargetSession } = await import("@supa-admin/workflows");
    vi.mocked(syncTargetSession).mockResolvedValue(
      err(
        new CustomError("Target bootstrap is not complete", {
          code: "workflows/precondition-failed",
        }),
      ),
    );

    const { connectionsHandlers } = await import("../handlers/index.js");
    await expect(
      callWithInput(
        connectionsHandlers.target.syncPermissions,
        {
          connectionId: TEST_IDS.connection,
          targetEmail: "target@example.com",
        },
        { context: adminCtx },
      ),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});

describe("connectionsHandlers.onboarding.status", () => {
  it("when allowed, then returns onboarding steps", async () => {
    const { completeOnboarding } = await import("@supa-admin/workflows");
    vi.mocked(completeOnboarding).mockResolvedValueOnce(
      ok({
        steps: {
          bootstrap: true,
          schemaSynced: false,
          rolesConfigured: false,
          usersProvisioned: false,
        },
        complete: false,
      }),
    );

    const { connectionsHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      connectionsHandlers.onboarding.status,
      { id: TEST_IDS.connection },
      { context: adminCtx },
    );
    expect(result.complete).toBe(false);
    expect(result.steps.bootstrap).toBe(true);
  });
});

describe("usersHandlers.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when roleIds and connectionIds provided, then updates assignments", async () => {
    const { updateUser } = await import("@supa-admin/feature-users");
    vi.mocked(updateUser).mockResolvedValue(ok({ success: true as const }));

    const { usersHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      usersHandlers.update,
      {
        id: TEST_IDS.user,
        roleIds: [TEST_IDS.role],
        connectionIds: [TEST_IDS.connection],
      },
      { context: adminCtx },
    );
    expect(result).toEqual({ success: true });
  });
});
