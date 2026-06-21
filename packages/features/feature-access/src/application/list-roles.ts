import "server-only";
import type { Role } from "@supa-admin/projections";
import {
  createAccessRepository,
  createDbContext,
} from "@supa-admin/repository-kit";

export async function listRoles(): Promise<Role[]> {
  const ctx = await createDbContext({ mode: "service" });
  const access = createAccessRepository(ctx.db);
  return access.listRoles();
}
