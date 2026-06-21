import { mockSupabaseQuery } from "@supa-admin/vitest-config/supabase-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFrom = vi.fn();

vi.mock("@supa-admin/auth/server", () => ({
  createMetaServerClient: vi.fn(async () => ({ from: mockFrom })),
}));

describe("buildTargetJwtPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when platform_admin, then grants full access for all connection tables", async () => {
    mockFrom.mockReturnValue(
      mockSupabaseQuery({
        data: [{ table_name: "posts" }, { table_name: "comments" }],
        error: null,
      }),
    );

    const { buildTargetJwtPermissions } = await import(
      "../src/jwt-permissions.js"
    );
    const result = await buildTargetJwtPermissions(
      "user-1",
      "conn-1",
      "platform_admin",
    );

    expect(result.permissions.posts).toEqual({
      can_read: true,
      can_create: true,
      can_update: true,
      can_delete: true,
    });
    expect(result.permissions.comments?.can_read).toBe(true);
  });

  it("when member with roles, then uses role permissions", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") {
        return mockSupabaseQuery({
          data: [{ role_id: "role-1" }],
          error: null,
        });
      }
      if (table === "role_permissions") {
        return mockSupabaseQuery({
          data: [
            {
              table_name: "posts",
              can_read: true,
              can_create: false,
              can_update: false,
              can_delete: false,
            },
          ],
          error: null,
        });
      }
      if (table === "user_permission_overrides") {
        return mockSupabaseQuery({ data: [], error: null });
      }
      return mockSupabaseQuery({ data: null, error: null });
    });

    const { buildTargetJwtPermissions } = await import(
      "../src/jwt-permissions.js"
    );
    const result = await buildTargetJwtPermissions(
      "user-1",
      "conn-1",
      "member",
    );

    expect(result.permissions.posts).toEqual({
      can_read: true,
      can_create: false,
      can_update: false,
      can_delete: false,
    });
  });
});

describe("getConnectionOnboardingStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when all steps satisfied, then complete is true", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connections") {
        return mockSupabaseQuery({
          data: { bootstrap_status: "ready", schema_cached_at: "2024-01-01" },
          error: null,
        });
      }
      if (table === "role_permissions" || table === "target_user_mappings") {
        const result = Promise.resolve({ data: null, error: null, count: 1 });
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue(result),
          }),
        };
      }
      return mockSupabaseQuery({ data: null, error: null });
    });

    const { getConnectionOnboardingStatus } = await import(
      "../src/onboarding-status.js"
    );
    const result = await getConnectionOnboardingStatus("conn-1");
    expect(result.complete).toBe(true);
    expect(result.steps.bootstrap).toBe(true);
    expect(result.steps.rolesConfigured).toBe(true);
  });
});
