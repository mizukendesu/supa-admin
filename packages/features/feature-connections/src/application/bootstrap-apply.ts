import "server-only";
import {
  createDbContext,
  findConnectionCredentials,
} from "@supa-admin/repository-kit";
import { executeTargetBootstrap } from "@supa-admin/rls";
import { ConnectionsFeatureError } from "../errors";

async function loadConnectionCredentials(connectionId: string) {
  const ctx = await createDbContext({ mode: "service" });
  const credentials = await findConnectionCredentials(ctx.db, connectionId);
  if (!credentials) {
    throw ConnectionsFeatureError.notFound(connectionId);
  }
  return credentials;
}

export async function bootstrapApply(connectionId: string) {
  const credentials = await loadConnectionCredentials(connectionId);
  const result = await executeTargetBootstrap(
    connectionId,
    credentials.url,
    credentials.serviceRoleEnc,
  );

  if (!result.success) {
    throw new ConnectionsFeatureError(result.error);
  }

  return { success: true as const, status: "ready" as const };
}
