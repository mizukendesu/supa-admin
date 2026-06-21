import "server-only";
import {
  createDbContext,
  findConnectionCredentials,
} from "@supa-admin/repository-kit";
import {
  executeTargetBootstrap,
  probeConnectionBootstrap,
} from "@supa-admin/rls";
import { ConnectionsFeatureError } from "../errors";

async function loadConnectionCredentials(connectionId: string) {
  const ctx = await createDbContext({ mode: "service" });
  const credentials = await findConnectionCredentials(ctx.db, connectionId);
  if (!credentials) {
    throw ConnectionsFeatureError.notFound(connectionId);
  }
  return credentials;
}

export async function bootstrapProbe(connectionId: string) {
  const credentials = await loadConnectionCredentials(connectionId);
  const probe = await probeConnectionBootstrap(
    connectionId,
    credentials.url,
    credentials.serviceRoleEnc,
  );

  if (probe.ready) {
    await executeTargetBootstrap(
      connectionId,
      credentials.url,
      credentials.serviceRoleEnc,
    );
    return { status: "ready" as const };
  }

  return { status: "pending" as const, setupSql: probe.setupSql };
}
