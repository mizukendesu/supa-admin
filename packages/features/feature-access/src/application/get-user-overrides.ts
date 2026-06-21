import "server-only";

import { ok, type Result } from "@supa-admin/ddd";
import type {
  PermissionOverrideRow,
  PermissionRow,
} from "@supa-admin/projections";
import {
  createAccessRepository,
  createDbContext,
} from "@supa-admin/repository-kit";
import type { AccessFeatureError } from "../errors";

export async function getUserOverrides(
  userId: string,
  connectionId: string,
): Promise<
  Result<
    {
      overrides: PermissionOverrideRow[];
      rolePermissions: PermissionRow[];
    },
    InstanceType<typeof AccessFeatureError>
  >
> {
  const ctx = await createDbContext({ mode: "service" });
  const access = createAccessRepository(ctx.db);

  const [overrides, rolePermissions] = await Promise.all([
    access.getUserPermissionOverrideRows(userId, connectionId),
    access.getRolePermissionsForUser(userId, connectionId),
  ]);

  return ok({ overrides, rolePermissions });
}
