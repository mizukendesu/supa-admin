import "server-only";
import { createMetaServerClient } from "@supa-admin/auth/server";
import type { PlatformRole, TablePermission } from "@supa-admin/projections";
import {
  buildFullAccessPermissions,
  resolvePermissionsRecord,
} from "@supa-admin/projections";

/** JWT app_metadata.permissions shape used by Target RLS policies. */
export async function buildTargetJwtPermissions(
  userId: string,
  connectionId: string,
  platformRole: PlatformRole,
): Promise<{ permissions: Record<string, TablePermission> }> {
  const supabase = await createMetaServerClient();

  if (platformRole === "platform_admin") {
    const { data: tables } = await supabase
      .from("connection_tables")
      .select("table_name")
      .eq("connection_id", connectionId);

    const resolved = buildFullAccessPermissions(
      connectionId,
      (tables ?? []).map((t) => t.table_name),
    );

    const permissions: Record<string, TablePermission> = {};
    for (const perm of resolved) {
      permissions[perm.table_name] = {
        can_read: perm.can_read,
        can_create: perm.can_create,
        can_update: perm.can_update,
        can_delete: perm.can_delete,
      };
    }
    return { permissions };
  }

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);

  const roleIds = (userRoles ?? []).map((r) => r.role_id);
  let rolePerms: Array<{
    table_name: string;
    can_read: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
  }> = [];

  if (roleIds.length > 0) {
    const { data } = await supabase
      .from("role_permissions")
      .select("table_name, can_read, can_create, can_update, can_delete")
      .eq("connection_id", connectionId)
      .in("role_id", roleIds);
    rolePerms = data ?? [];
  }

  const { data: overrides } = await supabase
    .from("user_permission_overrides")
    .select("table_name, can_read, can_create, can_update, can_delete")
    .eq("user_id", userId)
    .eq("connection_id", connectionId);

  const permissions = resolvePermissionsRecord(rolePerms, overrides ?? []);
  return { permissions };
}
