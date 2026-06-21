import "server-only";
import { err, ok, type Result } from "@supa-admin/ddd";
import type { PermissionOverrideRow } from "@supa-admin/projections";
import {
  createAccessRepository,
  createDbContext,
} from "@supa-admin/repository-kit";
import { AccessFeatureError } from "../errors";

export async function updateUserOverrides(
  userId: string,
  connectionId: string,
  overrides: PermissionOverrideRow[],
): Promise<Result<{ success: true }, InstanceType<typeof AccessFeatureError>>> {
  try {
    const ctx = await createDbContext({ mode: "service" });
    const access = createAccessRepository(ctx.db);
    await access.replaceUserPermissionOverrides(
      userId,
      connectionId,
      overrides,
    );
    return ok({ success: true as const });
  } catch (error) {
    return err(
      new AccessFeatureError(
        error instanceof Error
          ? error.message
          : "Failed to update user permission overrides",
      ),
    );
  }
}
