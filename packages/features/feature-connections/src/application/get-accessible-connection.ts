import "server-only";
import { err, ok, type Result } from "@supa-admin/ddd";
import type { PlatformRole } from "@supa-admin/projections";
import {
  connectionExists,
  createAccessRepository,
  createConnectionRepository,
  createDbContext,
  isConnectionMember,
} from "@supa-admin/repository-kit";
import { ConnectionsFeatureError } from "../errors";

async function assertConnectionAccess(
  connectionId: string,
  userId: string,
  role: PlatformRole,
): Promise<Result<void, InstanceType<typeof ConnectionsFeatureError>>> {
  if (role === "platform_admin") {
    return ok(undefined);
  }

  const ctx = await createDbContext({ mode: "service" });
  const allowed = await isConnectionMember(ctx.db, connectionId, userId);
  if (!allowed) {
    return err(
      new ConnectionsFeatureError("Forbidden", {
        code: "feature-connections/forbidden",
      }),
    );
  }
  return ok(undefined);
}

export async function getAccessibleConnection(
  connectionId: string,
  userId: string,
  role: PlatformRole,
) {
  const accessCheck = await assertConnectionAccess(connectionId, userId, role);
  if (!accessCheck.ok) {
    return accessCheck;
  }

  const ctx = await createDbContext({ mode: "service" });
  const repo = createConnectionRepository(ctx.db);
  const connection = await repo.findById(connectionId);

  if (!connection) {
    return err(ConnectionsFeatureError.notFound(connectionId));
  }

  const tables = await repo.listTables(connectionId);
  return ok({
    connection: {
      id: connection.id,
      name: connection.name,
      url: connection.url,
      bootstrap_status: connection.bootstrap_status,
    },
    tables,
  });
}

export async function userCanAccessConnection(
  connectionId: string,
  userId: string,
  role: PlatformRole,
): Promise<boolean> {
  if (role === "platform_admin") {
    const ctx = await createDbContext({ mode: "service" });
    return connectionExists(ctx.db, connectionId);
  }

  const ctx = await createDbContext({ mode: "service" });
  const access = createAccessRepository(ctx.db);
  const ids = await access.getMemberConnectionIds(userId);
  return ids.includes(connectionId);
}
