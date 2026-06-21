import "server-only";
import { err, ok, type Result } from "@supa-admin/ddd";
import {
  createConnectionRepository,
  createDbContext,
} from "@supa-admin/repository-kit";
import { ConnectionsFeatureError } from "../errors";

export async function getConnection(id: string): Promise<
  Result<
    {
      connection: NonNullable<
        Awaited<
          ReturnType<ReturnType<typeof createConnectionRepository>["findById"]>
        >
      >;
      tables: Awaited<
        ReturnType<ReturnType<typeof createConnectionRepository>["listTables"]>
      >;
    },
    InstanceType<typeof ConnectionsFeatureError>
  >
> {
  const ctx = await createDbContext({ mode: "service" });
  const repo = createConnectionRepository(ctx.db);
  const connection = await repo.findById(id);
  if (!connection) {
    return err(ConnectionsFeatureError.notFound(id));
  }
  const tables = await repo.listTables(id);
  return ok({ connection, tables });
}

export type GetConnectionResult = Awaited<ReturnType<typeof getConnection>>;
