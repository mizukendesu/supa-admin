import "server-only";
import type { RolePermission } from "@supa-admin/projections";
import {
  createAccessRepository,
  createDbContext,
} from "@supa-admin/repository-kit";

export async function getRolePermissions(
  roleId: string,
  connectionId: string,
): Promise<RolePermission[]> {
  const ctx = await createDbContext({ mode: "service" });
  const access = createAccessRepository(ctx.db);
  return access.getRolePermissions(roleId, connectionId);
}
