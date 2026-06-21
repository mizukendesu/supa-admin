import "server-only";
import {
  buildFullAccessPermissions,
  type PlatformRole,
  type ResolvedPermission,
  resolvePermissionsFromRows,
  type TablePermission,
} from "@supa-admin/projections";
import {
  createAccessRepository,
  createDbContext,
  listConnectionTableNames,
} from "@supa-admin/repository-kit";

export async function resolveUserPermissions(
  userId: string,
  connectionId: string,
  role: PlatformRole,
): Promise<ResolvedPermission[]> {
  const ctx = await createDbContext({ mode: "service" });
  const access = createAccessRepository(ctx.db);

  if (role === "platform_admin") {
    const tableNames = await listConnectionTableNames(ctx.db, connectionId);
    return buildFullAccessPermissions(connectionId, tableNames);
  }

  const rolePerms = await access.getRolePermissionsForUser(
    userId,
    connectionId,
  );
  const overrides = await access.getUserPermissionOverrideRows(
    userId,
    connectionId,
  );

  return resolvePermissionsFromRows(connectionId, rolePerms, overrides);
}

export async function getUserConnectionIds(
  userId: string,
  role: PlatformRole,
): Promise<string[]> {
  const ctx = await createDbContext({ mode: "service" });
  const access = createAccessRepository(ctx.db);

  if (role === "platform_admin") {
    return access.listAllConnectionIds();
  }

  return access.getMemberConnectionIds(userId);
}

export async function canAccessTable(
  userId: string,
  connectionId: string,
  tableName: string,
  action: keyof TablePermission,
  role: PlatformRole,
): Promise<boolean> {
  const perms = await resolveUserPermissions(userId, connectionId, role);
  const tablePerm = perms.find((p) => p.table_name === tableName);
  return tablePerm?.[action] ?? false;
}
