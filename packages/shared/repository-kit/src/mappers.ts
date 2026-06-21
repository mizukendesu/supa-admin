import type { schema } from "@supa-admin/db";
import type {
  BootstrapStatus,
  ColumnMeta,
  Connection,
  ConnectionTable,
  PermissionOverrideRow,
  PermissionRow,
  PlatformRole,
  Profile,
  Role,
  RolePermission,
  UserPermissionOverride,
} from "@supa-admin/projections";

type ConnectionRow = typeof schema.connections.$inferSelect;
type ConnectionTableRow = typeof schema.connectionTables.$inferSelect;
type ProfileRow = typeof schema.profiles.$inferSelect;
type RoleRow = typeof schema.roles.$inferSelect;
type RolePermissionRow = typeof schema.rolePermissions.$inferSelect;
type UserPermissionOverrideRow =
  typeof schema.userPermissionOverrides.$inferSelect;

function toIsoString(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function toConnection(row: ConnectionRow): Connection & {
  webhook_secret_enc: string | null;
} {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    anon_key_enc: row.anonKeyEnc,
    service_role_enc: row.serviceRoleEnc,
    webhook_secret_enc: row.webhookSecretEnc ?? null,
    schema_cached_at: toIsoString(row.schemaCachedAt),
    bootstrap_status: row.bootstrapStatus as BootstrapStatus,
    bootstrap_verified_at: toIsoString(row.bootstrapVerifiedAt),
    created_by: row.createdBy,
    created_at: toIsoString(row.createdAt) ?? row.createdAt.toISOString(),
    updated_at: toIsoString(row.updatedAt) ?? row.updatedAt.toISOString(),
  };
}

export function toConnectionSummary(row: ConnectionRow) {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    schema_cached_at: toIsoString(row.schemaCachedAt),
    bootstrap_status: row.bootstrapStatus as BootstrapStatus,
    bootstrap_verified_at: toIsoString(row.bootstrapVerifiedAt),
    created_by: row.createdBy,
    created_at: toIsoString(row.createdAt) ?? row.createdAt.toISOString(),
    updated_at: toIsoString(row.updatedAt) ?? row.updatedAt.toISOString(),
  };
}

export function toConnectionTable(row: ConnectionTableRow): ConnectionTable {
  return {
    id: row.id,
    connection_id: row.connectionId,
    table_name: row.tableName,
    columns: row.columns as ColumnMeta[],
    created_at: toIsoString(row.createdAt) ?? row.createdAt.toISOString(),
    updated_at: toIsoString(row.updatedAt) ?? row.updatedAt.toISOString(),
  };
}

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    display_name: row.displayName,
    role: row.role as PlatformRole,
    created_at: toIsoString(row.createdAt) ?? row.createdAt.toISOString(),
    updated_at: toIsoString(row.updatedAt) ?? row.updatedAt.toISOString(),
  };
}

export function toRole(row: RoleRow): Role {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    created_at: toIsoString(row.createdAt) ?? row.createdAt.toISOString(),
    updated_at: toIsoString(row.updatedAt) ?? row.updatedAt.toISOString(),
  };
}

export function toRolePermission(row: RolePermissionRow): RolePermission {
  return {
    id: row.id,
    role_id: row.roleId,
    connection_id: row.connectionId,
    table_name: row.tableName,
    can_read: row.canRead,
    can_create: row.canCreate,
    can_update: row.canUpdate,
    can_delete: row.canDelete,
  };
}

export function toPermissionRow(row: RolePermissionRow): PermissionRow {
  return {
    table_name: row.tableName,
    can_read: row.canRead,
    can_create: row.canCreate,
    can_update: row.canUpdate,
    can_delete: row.canDelete,
  };
}

export function toUserPermissionOverride(
  row: UserPermissionOverrideRow,
): UserPermissionOverride {
  return {
    id: row.id,
    user_id: row.userId,
    connection_id: row.connectionId,
    table_name: row.tableName,
    can_read: row.canRead,
    can_create: row.canCreate,
    can_update: row.canUpdate,
    can_delete: row.canDelete,
  };
}

export function toPermissionOverrideRow(
  row: UserPermissionOverrideRow,
): PermissionOverrideRow {
  return {
    table_name: row.tableName,
    can_read: row.canRead,
    can_create: row.canCreate,
    can_update: row.canUpdate,
    can_delete: row.canDelete,
  };
}
