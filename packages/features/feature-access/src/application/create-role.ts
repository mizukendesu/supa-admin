import "server-only";
import { err, ok, type Result } from "@supa-admin/ddd";
import type { Role } from "@supa-admin/projections";
import {
  createAccessRepository,
  createDbContext,
} from "@supa-admin/repository-kit";
import { Role as RoleAggregate } from "../domain/role";
import { AccessFeatureError } from "../errors";

export async function createRole(
  name: string,
  description?: string | null,
): Promise<Result<Role, InstanceType<typeof AccessFeatureError>>> {
  try {
    const validatedName = RoleAggregate.validateCreateInput(name);
    const ctx = await createDbContext({ mode: "service" });
    const access = createAccessRepository(ctx.db);
    const role = await access.createRole(validatedName, description);
    return ok(role);
  } catch (error) {
    if (error instanceof AccessFeatureError) {
      return err(error);
    }
    return err(
      new AccessFeatureError(
        error instanceof Error ? error.message : "Failed to create role",
      ),
    );
  }
}
