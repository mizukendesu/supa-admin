import "server-only";
import { err, ok, type Result } from "@supa-admin/ddd";
import type { PermissionRow } from "@supa-admin/projections";
import {
  createAccessRepository,
  createDbContext,
} from "@supa-admin/repository-kit";
import { AccessFeatureError } from "../errors";

export async function updateRolePermissions(
  roleId: string,
  connectionId: string,
  permissions: PermissionRow[],
): Promise<Result<{ success: true }, InstanceType<typeof AccessFeatureError>>> {
  try {
    const ctx = await createDbContext({ mode: "service" });
    const access = createAccessRepository(ctx.db);
    await access.replaceRolePermissions(roleId, connectionId, permissions);
    return ok({ success: true as const });
  } catch (error) {
    return err(
      error instanceof AccessFeatureError
        ? error
        : new AccessFeatureError(
            error instanceof Error
              ? error.message
              : "Failed to update role permissions",
          ),
    );
  }
}
