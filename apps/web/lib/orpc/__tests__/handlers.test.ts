import { err } from "@supa-admin/ddd";
import { CustomError } from "@supa-admin/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminCallContext,
  callWithInput,
  callWithoutInput,
  TEST_IDS,
} from "./helpers.js";

vi.mock("server-only", () => ({}));

vi.mock("@supa-admin/feature-setup", () => ({
  isSetupComplete: vi.fn().mockResolvedValue(true),
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
  previewConnectionRls: vi.fn().mockResolvedValue({
    sql: "-- sql",
    sqlHash: "abc",
    permissionCount: 1,
  }),
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
}));

const adminCtx = adminCallContext();

describe("setupHandlers", () => {
  it("when isComplete called, then returns complete flag", async () => {
    const { setupHandlers } = await import("../handlers/index.js");
    const result = await callWithoutInput(setupHandlers.isComplete, {
      context: { actorId: null, clientIp: "127.0.0.1" },
    });
    expect(result).toEqual({ complete: true });
  });
});

describe("connectionsHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when list called, then returns connections", async () => {
    const { listConnections } = await import("@supa-admin/feature-connections");
    vi.mocked(listConnections).mockResolvedValue([
      {
        id: TEST_IDS.connection,
        name: "Conn",
        url: "https://x.co",
        schema_cached_at: null,
        bootstrap_status: "ready",
        bootstrap_verified_at: null,
        created_by: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
    ]);

    const { connectionsHandlers } = await import("../handlers/index.js");
    const result = await callWithoutInput(connectionsHandlers.list, {
      context: adminCtx,
    });
    expect(result).toEqual({
      connections: [
        {
          id: TEST_IDS.connection,
          name: "Conn",
          url: "https://x.co",
          schema_cached_at: null,
          bootstrap_status: "ready",
          bootstrap_verified_at: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ],
    });
  });

  it("when create with invalid url, then throws BAD_REQUEST", async () => {
    const { createConnectionWorkflow } = await import("@supa-admin/workflows");
    vi.mocked(createConnectionWorkflow).mockResolvedValue(
      err(
        new CustomError("Invalid URL", {
          code: "feature-connections/invalid-url",
        }),
      ),
    );

    const { connectionsHandlers } = await import("../handlers/index.js");
    await expect(
      callWithInput(
        connectionsHandlers.create,
        {
          name: "Test",
          url: "not-valid",
          anonKey: "anon",
          serviceRoleKey: "service",
        },
        { context: adminCtx },
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("rolesHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when list called, then returns roles", async () => {
    const { listRoles } = await import("@supa-admin/feature-access");
    vi.mocked(listRoles).mockResolvedValue([
      {
        id: TEST_IDS.role,
        name: "Editor",
        description: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
    ]);

    const { rolesHandlers } = await import("../handlers/index.js");
    const result = await callWithoutInput(rolesHandlers.list, {
      context: adminCtx,
    });
    expect(result).toEqual({
      roles: [
        {
          id: TEST_IDS.role,
          name: "Editor",
          description: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ],
    });
  });

  it("when getPermissions called, then returns role permissions", async () => {
    const { getRolePermissions } = await import("@supa-admin/feature-access");
    vi.mocked(getRolePermissions).mockResolvedValue([
      {
        id: "perm-1",
        role_id: TEST_IDS.role,
        connection_id: TEST_IDS.connection,
        table_name: "posts",
        can_read: true,
        can_create: false,
        can_update: false,
        can_delete: false,
      },
    ]);

    const { rolesHandlers } = await import("../handlers/index.js");
    const result = await callWithInput(
      rolesHandlers.getPermissions,
      { roleId: TEST_IDS.role, connectionId: TEST_IDS.connection },
      { context: adminCtx },
    );
    expect(result.permissions[0]?.table_name).toBe("posts");
  });
});

describe("usersHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when list called, then returns users", async () => {
    const { listUsers } = await import("@supa-admin/feature-users");
    vi.mocked(listUsers).mockResolvedValue([
      {
        id: TEST_IDS.user,
        email: "a@b.com",
        display_name: "A",
        role: "member",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
    ]);

    const { usersHandlers } = await import("../handlers/index.js");
    const result = await callWithoutInput(usersHandlers.list, {
      context: adminCtx,
    });
    expect(result).toEqual({
      users: [
        {
          id: TEST_IDS.user,
          email: "a@b.com",
          display_name: "A",
          role: "member",
          created_at: "2024-01-01",
        },
      ],
    });
  });
});

describe("connectionsRlsHandlers", () => {
  it("when preview called, then delegates to previewConnectionRls", async () => {
    const { previewConnectionRls } = await import(
      "@supa-admin/feature-connections"
    );
    const { connectionsRlsHandlers } = await import("../handlers/index.js");

    const result = await callWithInput(
      connectionsRlsHandlers.preview,
      { id: TEST_IDS.connection },
      { context: adminCtx },
    );

    expect(previewConnectionRls).toHaveBeenCalledWith(TEST_IDS.connection);
    expect(result).toEqual({
      sql: "-- sql",
      sqlHash: "abc",
      permissionCount: 1,
    });
  });
});
