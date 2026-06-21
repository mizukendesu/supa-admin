import {
  aggregateRolePermissions,
  applyPermissionOverrides,
  buildFullAccessPermissions,
  resolvePermissionsFromRows,
} from "@supa-admin/projections";
import { describe, expect, it } from "vitest";

describe("permission resolution helpers", () => {
  it("when platform admin tables listed, then full access granted", () => {
    const perms = buildFullAccessPermissions("conn-1", ["posts", "comments"]);
    expect(perms).toHaveLength(2);
    expect(perms[0]).toMatchObject({
      connection_id: "conn-1",
      table_name: "posts",
      can_read: true,
      can_delete: true,
    });
  });

  it("when roles and overrides merged, then resolves expected permissions", () => {
    const rolePerms = [
      {
        table_name: "posts",
        can_read: true,
        can_create: false,
        can_update: false,
        can_delete: false,
      },
    ];
    const overrides = [
      {
        table_name: "posts",
        can_read: null,
        can_create: true,
        can_update: null,
        can_delete: null,
      },
    ];

    const permMap = applyPermissionOverrides(
      aggregateRolePermissions(rolePerms),
      overrides,
    );
    const resolved = resolvePermissionsFromRows("conn-1", rolePerms, overrides);

    expect(permMap.get("posts")?.can_create).toBe(true);
    expect(resolved[0]?.can_read).toBe(true);
    expect(resolved[0]?.can_create).toBe(true);
  });
});
