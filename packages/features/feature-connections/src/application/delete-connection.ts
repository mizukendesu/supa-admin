import "server-only";
import { ok } from "@supa-admin/ddd";
import {
  createConnectionRepository,
  createDbContext,
} from "@supa-admin/repository-kit";

export async function deleteConnection(id: string) {
  const ctx = await createDbContext({ mode: "service" });
  const repo = createConnectionRepository(ctx.db);
  await repo.delete(id);
  return ok({ success: true as const });
}
