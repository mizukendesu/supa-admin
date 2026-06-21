import { and, type DbOrTx, eq, inArray, schema } from "@supa-admin/db";
import type {
  PermissionOverrideRow,
  PermissionRow,
} from "@supa-admin/projections";
import {
  toPermissionOverrideRow,
  toPermissionRow,
  toRole,
  toRolePermission,
  toUserPermissionOverride,
} from "../mappers";

export type AccessRepository = ReturnType<typeof createAccessRepository>;

export function createAccessRepository(db: DbOrTx) {
  return {
    async listRoles() {
      const rows = await db
        .select()
        .from(schema.roles)
        .orderBy(schema.roles.name);
      return rows.map(toRole);
    },

    async createRole(name: string, description?: string | null) {
      const [row] = await db
        .insert(schema.roles)
        .values({ name, description: description ?? null })
        .returning();
      if (!row) {
        throw new Error("Failed to create role");
      }
      return toRole(row);
    },

    async getRolePermissions(roleId: string, connectionId: string) {
      const rows = await db
        .select()
        .from(schema.rolePermissions)
        .where(
          and(
            eq(schema.rolePermissions.roleId, roleId),
            eq(schema.rolePermissions.connectionId, connectionId),
          ),
        );
      return rows.map(toRolePermission);
    },

    async replaceRolePermissions(
      roleId: string,
      connectionId: string,
      permissions: Array<
        PermissionRow & {
          table_name: string;
        }
      >,
    ) {
      await db
        .delete(schema.rolePermissions)
        .where(
          and(
            eq(schema.rolePermissions.roleId, roleId),
            eq(schema.rolePermissions.connectionId, connectionId),
          ),
        );

      if (permissions.length === 0) return;

      await db.insert(schema.rolePermissions).values(
        permissions.map((permission) => ({
          roleId,
          connectionId,
          tableName: permission.table_name,
          canRead: permission.can_read,
          canCreate: permission.can_create,
          canUpdate: permission.can_update,
          canDelete: permission.can_delete,
        })),
      );
    },

    async getUserRoleIds(userId: string) {
      const rows = await db
        .select({ roleId: schema.userRoles.roleId })
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, userId));
      return rows.map((row) => row.roleId);
    },

    async getMemberConnectionIds(userId: string) {
      const rows = await db
        .select({ connectionId: schema.connectionMembers.connectionId })
        .from(schema.connectionMembers)
        .where(eq(schema.connectionMembers.userId, userId));
      return rows.map((row) => row.connectionId);
    },

    async listAllConnectionIds() {
      const rows = await db
        .select({ id: schema.connections.id })
        .from(schema.connections);
      return rows.map((row) => row.id);
    },

    async getRolePermissionsForUser(userId: string, connectionId: string) {
      const roleIds = await this.getUserRoleIds(userId);
      if (roleIds.length === 0) return [] as PermissionRow[];

      const rows = await db
        .select()
        .from(schema.rolePermissions)
        .where(
          and(
            eq(schema.rolePermissions.connectionId, connectionId),
            inArray(schema.rolePermissions.roleId, roleIds),
          ),
        );
      return rows.map(toPermissionRow);
    },

    async getUserPermissionOverrides(userId: string, connectionId: string) {
      const rows = await db
        .select()
        .from(schema.userPermissionOverrides)
        .where(
          and(
            eq(schema.userPermissionOverrides.userId, userId),
            eq(schema.userPermissionOverrides.connectionId, connectionId),
          ),
        );
      return rows.map(toUserPermissionOverride);
    },

    async getUserPermissionOverrideRows(
      userId: string,
      connectionId: string,
    ): Promise<PermissionOverrideRow[]> {
      const rows = await db
        .select()
        .from(schema.userPermissionOverrides)
        .where(
          and(
            eq(schema.userPermissionOverrides.userId, userId),
            eq(schema.userPermissionOverrides.connectionId, connectionId),
          ),
        );
      return rows.map(toPermissionOverrideRow);
    },

    async replaceUserPermissionOverrides(
      userId: string,
      connectionId: string,
      overrides: Array<
        PermissionOverrideRow & {
          table_name: string;
        }
      >,
    ) {
      await db
        .delete(schema.userPermissionOverrides)
        .where(
          and(
            eq(schema.userPermissionOverrides.userId, userId),
            eq(schema.userPermissionOverrides.connectionId, connectionId),
          ),
        );

      if (overrides.length === 0) return;

      await db.insert(schema.userPermissionOverrides).values(
        overrides.map((override) => ({
          userId,
          connectionId,
          tableName: override.table_name,
          canRead: override.can_read,
          canCreate: override.can_create,
          canUpdate: override.can_update,
          canDelete: override.can_delete,
        })),
      );
    },
  };
}
