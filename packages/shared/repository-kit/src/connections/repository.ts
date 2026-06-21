import { randomBytes } from "node:crypto";
import { encrypt } from "@supa-admin/crypto";
import { and, type DbOrTx, desc, eq, inArray, schema } from "@supa-admin/db";
import type { BootstrapStatus, ColumnMeta } from "@supa-admin/projections";
import {
  toConnection,
  toConnectionSummary,
  toConnectionTable,
} from "../mappers";

export type CreateConnectionInput = {
  name: string;
  url: string;
  anonKeyEnc: string;
  serviceRoleEnc: string;
  createdBy?: string | null;
  bootstrapStatus?: BootstrapStatus;
  webhookSecretEnc?: string | null;
};

export type ConnectionRepository = ReturnType<
  typeof createConnectionRepository
>;

export function createConnectionRepository(db: DbOrTx) {
  return {
    async list() {
      const rows = await db
        .select()
        .from(schema.connections)
        .orderBy(desc(schema.connections.createdAt));
      return rows.map(toConnectionSummary);
    },

    async listByIds(ids: string[]) {
      if (ids.length === 0) return [];
      const rows = await db
        .select()
        .from(schema.connections)
        .where(inArray(schema.connections.id, ids))
        .orderBy(desc(schema.connections.createdAt));
      return rows.map(toConnectionSummary);
    },

    async findById(id: string) {
      const [row] = await db
        .select()
        .from(schema.connections)
        .where(eq(schema.connections.id, id))
        .limit(1);
      return row ? toConnection(row) : null;
    },

    async create(input: CreateConnectionInput) {
      const webhookSecretEnc =
        input.webhookSecretEnc ?? encrypt(randomBytes(32).toString("hex"));

      const [row] = await db
        .insert(schema.connections)
        .values({
          name: input.name,
          url: input.url,
          anonKeyEnc: input.anonKeyEnc,
          serviceRoleEnc: input.serviceRoleEnc,
          webhookSecretEnc,
          createdBy: input.createdBy ?? null,
          bootstrapStatus: input.bootstrapStatus ?? "pending",
        })
        .returning();
      if (!row) {
        throw new Error("Failed to create connection");
      }
      return toConnection(row);
    },

    async delete(id: string) {
      await db.delete(schema.connections).where(eq(schema.connections.id, id));
    },

    async updateSchemaCachedAt(id: string, cachedAt: Date) {
      await db
        .update(schema.connections)
        .set({
          schemaCachedAt: cachedAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.connections.id, id));
    },

    async updateBootstrapStatus(
      id: string,
      status: BootstrapStatus,
      verifiedAt?: Date | null,
    ) {
      await db
        .update(schema.connections)
        .set({
          bootstrapStatus: status,
          bootstrapVerifiedAt: verifiedAt ?? null,
          updatedAt: new Date(),
        })
        .where(eq(schema.connections.id, id));
    },

    async setWebhookSecretEnc(id: string, webhookSecretEnc: string) {
      const [row] = await db
        .update(schema.connections)
        .set({
          webhookSecretEnc,
          updatedAt: new Date(),
        })
        .where(eq(schema.connections.id, id))
        .returning();
      return row ? toConnection(row) : null;
    },

    async getWebhookSecretEnc(id: string) {
      const [row] = await db
        .select({ webhookSecretEnc: schema.connections.webhookSecretEnc })
        .from(schema.connections)
        .where(eq(schema.connections.id, id))
        .limit(1);
      return row?.webhookSecretEnc ?? null;
    },

    async listTables(connectionId: string) {
      const rows = await db
        .select()
        .from(schema.connectionTables)
        .where(eq(schema.connectionTables.connectionId, connectionId))
        .orderBy(schema.connectionTables.tableName);
      return rows.map(toConnectionTable);
    },

    async replaceTables(
      connectionId: string,
      tables: Array<{ tableName: string; columns: ColumnMeta[] }>,
    ) {
      await db
        .delete(schema.connectionTables)
        .where(eq(schema.connectionTables.connectionId, connectionId));

      if (tables.length === 0) return;

      await db.insert(schema.connectionTables).values(
        tables.map((table) => ({
          connectionId,
          tableName: table.tableName,
          columns: table.columns,
        })),
      );
    },

    async insertTables(
      connectionId: string,
      tables: Array<{ tableName: string; columns: ColumnMeta[] }>,
    ) {
      if (tables.length === 0) return;
      await db.insert(schema.connectionTables).values(
        tables.map((table) => ({
          connectionId,
          tableName: table.tableName,
          columns: table.columns,
        })),
      );
    },
  };
}

export async function findConnectionCredentials(
  db: DbOrTx,
  id: string,
): Promise<{
  url: string;
  serviceRoleEnc: string;
  bootstrapStatus: BootstrapStatus;
} | null> {
  const [row] = await db
    .select({
      url: schema.connections.url,
      serviceRoleEnc: schema.connections.serviceRoleEnc,
      bootstrapStatus: schema.connections.bootstrapStatus,
    })
    .from(schema.connections)
    .where(eq(schema.connections.id, id))
    .limit(1);

  if (!row) return null;

  return {
    url: row.url,
    serviceRoleEnc: row.serviceRoleEnc,
    bootstrapStatus: row.bootstrapStatus as BootstrapStatus,
  };
}

export async function findConnectionAnonKeyEnc(
  db: DbOrTx,
  id: string,
): Promise<string | null> {
  const [row] = await db
    .select({ anonKeyEnc: schema.connections.anonKeyEnc })
    .from(schema.connections)
    .where(eq(schema.connections.id, id))
    .limit(1);
  return row?.anonKeyEnc ?? null;
}

export async function listConnectionTableNames(
  db: DbOrTx,
  connectionId: string,
): Promise<string[]> {
  const rows = await db
    .select({ tableName: schema.connectionTables.tableName })
    .from(schema.connectionTables)
    .where(eq(schema.connectionTables.connectionId, connectionId));
  return rows.map((row) => row.tableName);
}

export async function connectionExists(
  db: DbOrTx,
  connectionId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.connections.id })
    .from(schema.connections)
    .where(eq(schema.connections.id, connectionId))
    .limit(1);
  return Boolean(row);
}

export async function isConnectionMember(
  db: DbOrTx,
  connectionId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.connectionMembers.id })
    .from(schema.connectionMembers)
    .where(
      and(
        eq(schema.connectionMembers.connectionId, connectionId),
        eq(schema.connectionMembers.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}
