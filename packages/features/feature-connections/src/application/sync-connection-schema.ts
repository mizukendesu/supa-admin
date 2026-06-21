import "server-only";
import { err, ok, type Result } from "@supa-admin/ddd";
import {
  createConnectionRepository,
  createDbContext,
} from "@supa-admin/repository-kit";
import { fetchSchemaViaRest } from "@supa-admin/schema";
import { ConnectionsFeatureError } from "../errors";

export async function syncConnectionSchema(connectionId: string) {
  const ctx = await createDbContext({ mode: "service" });
  const repo = createConnectionRepository(ctx.db);
  const connection = await repo.findById(connectionId);

  if (!connection) {
    return err(ConnectionsFeatureError.notFound(connectionId));
  }

  const result = await fetchSchemaViaRest(
    connection.url,
    connection.service_role_enc,
  );

  if (result.error && result.tables.length === 0) {
    return err(new ConnectionsFeatureError(result.error));
  }

  await repo.replaceTables(
    connectionId,
    result.tables.map((table) => ({
      tableName: table.table_name,
      columns: table.columns,
    })),
  );
  await repo.updateSchemaCachedAt(connectionId, new Date());

  return ok({ success: true as const, tableCount: result.tables.length });
}

export type SyncConnectionSchemaResult = Result<
  { success: true; tableCount: number },
  InstanceType<typeof ConnectionsFeatureError>
>;
