import "server-only";

import { ok, type Result } from "@supa-admin/ddd";
import {
  createAccessRepository,
  createDbContext,
  createUsersRepository,
} from "@supa-admin/repository-kit";
import type { WorkflowError } from "./internal/errors";

export type DashboardStats = {
  userCount: number;
  roleCount: number;
};

export async function getDashboardStatsWorkflow(): Promise<
  Result<DashboardStats, InstanceType<typeof WorkflowError>>
> {
  const ctx = await createDbContext({ mode: "service" });
  const users = createUsersRepository(ctx.db);
  const access = createAccessRepository(ctx.db);
  const [profiles, roles] = await Promise.all([
    users.listProfiles(),
    access.listRoles(),
  ]);
  return ok({ userCount: profiles.length, roleCount: roles.length });
}
