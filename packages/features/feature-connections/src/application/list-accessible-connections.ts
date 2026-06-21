import "server-only";
import type { PlatformRole } from "@supa-admin/projections";
import {
  createAccessRepository,
  createConnectionRepository,
  createDbContext,
} from "@supa-admin/repository-kit";

async function resolveAccessibleConnectionIds(
  userId: string,
  role: PlatformRole,
): Promise<string[]> {
  const ctx = await createDbContext({ mode: "service" });
  const access = createAccessRepository(ctx.db);

  if (role === "platform_admin") {
    return access.listAllConnectionIds();
  }

  return access.getMemberConnectionIds(userId);
}

export async function listAccessibleConnections(
  userId: string,
  role: PlatformRole,
) {
  const connectionIds = await resolveAccessibleConnectionIds(userId, role);
  if (connectionIds.length === 0) {
    return [];
  }

  const ctx = await createDbContext({ mode: "service" });
  const repo = createConnectionRepository(ctx.db);
  return repo.listByIds(connectionIds);
}
