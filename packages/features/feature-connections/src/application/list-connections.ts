import "server-only";
import {
  createConnectionRepository,
  createDbContext,
} from "@supa-admin/repository-kit";

export async function listConnections() {
  const ctx = await createDbContext({ mode: "service" });
  const connections = createConnectionRepository(ctx.db);
  return connections.list();
}
