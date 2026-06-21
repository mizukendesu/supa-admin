import { type DbOrTx, desc, eq, inArray, schema } from "@supa-admin/db";
import type { PlatformRole } from "@supa-admin/projections";
import { toProfile } from "../mappers";

export type UsersRepository = ReturnType<typeof createUsersRepository>;

export function createUsersRepository(db: DbOrTx) {
  return {
    async listProfiles() {
      const rows = await db
        .select()
        .from(schema.profiles)
        .orderBy(desc(schema.profiles.createdAt));
      return rows.map(toProfile);
    },

    async findProfileById(id: string) {
      const [row] = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.id, id))
        .limit(1);
      return row ? toProfile(row) : null;
    },

    async updateProfile(
      id: string,
      input: {
        displayName?: string | null;
        role?: PlatformRole;
      },
    ) {
      const [row] = await db
        .update(schema.profiles)
        .set({
          displayName: input.displayName,
          role: input.role,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.id, id))
        .returning();
      return row ? toProfile(row) : null;
    },

    async getUserRoles(userId: string) {
      const rows = await db
        .select({
          roleId: schema.userRoles.roleId,
          roleName: schema.roles.name,
          roleDescription: schema.roles.description,
        })
        .from(schema.userRoles)
        .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
        .where(eq(schema.userRoles.userId, userId));
      return rows.map((row) => ({
        role_id: row.roleId,
        roles: {
          id: row.roleId,
          name: row.roleName,
          description: row.roleDescription,
        },
      }));
    },

    async getMemberships(userId: string) {
      const rows = await db
        .select({
          connectionId: schema.connectionMembers.connectionId,
          connectionName: schema.connections.name,
        })
        .from(schema.connectionMembers)
        .innerJoin(
          schema.connections,
          eq(schema.connectionMembers.connectionId, schema.connections.id),
        )
        .where(eq(schema.connectionMembers.userId, userId));
      return rows.map((row) => ({
        connection_id: row.connectionId,
        connections: {
          id: row.connectionId,
          name: row.connectionName,
        },
      }));
    },

    async replaceUserRoles(userId: string, roleIds: string[]) {
      await db
        .delete(schema.userRoles)
        .where(eq(schema.userRoles.userId, userId));

      if (roleIds.length === 0) return;

      await db.insert(schema.userRoles).values(
        roleIds.map((roleId) => ({
          userId,
          roleId,
        })),
      );
    },

    async replaceConnectionMemberships(
      userId: string,
      connectionIds: string[],
    ) {
      await db
        .delete(schema.connectionMembers)
        .where(eq(schema.connectionMembers.userId, userId));

      if (connectionIds.length === 0) return;

      await db.insert(schema.connectionMembers).values(
        connectionIds.map((connectionId) => ({
          userId,
          connectionId,
        })),
      );
    },

    async listProfilesByIds(ids: string[]) {
      if (ids.length === 0) return [];
      const rows = await db
        .select()
        .from(schema.profiles)
        .where(inArray(schema.profiles.id, ids));
      return rows.map(toProfile);
    },
  };
}
