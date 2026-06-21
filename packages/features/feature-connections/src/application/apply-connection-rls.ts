import "server-only";

import {
  createDbContext,
  findConnectionCredentials,
} from "@supa-admin/repository-kit";
import { executeRlsSync } from "@supa-admin/rls";
import { ConnectionsFeatureError } from "../errors";

export async function applyConnectionRls(
  connectionId: string,
  executedBy: string,
) {
  const ctx = await createDbContext({ mode: "service" });
  const credentials = await findConnectionCredentials(ctx.db, connectionId);

  if (!credentials) {
    throw ConnectionsFeatureError.notFound(connectionId);
  }

  if (credentials.bootstrapStatus !== "ready") {
    throw new ConnectionsFeatureError("Target bootstrap is not complete", {
      code: "feature-connections/precondition-failed",
    });
  }

  const result = await executeRlsSync(
    connectionId,
    credentials.url,
    credentials.serviceRoleEnc,
    executedBy,
  );

  if (!result.success) {
    throw new ConnectionsFeatureError(result.error ?? "RLS sync failed");
  }

  return { success: true as const, sql: result.sql ?? "" };
}
