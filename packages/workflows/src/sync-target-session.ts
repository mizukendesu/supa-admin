import "server-only";

import { err, ok, type Result } from "@supa-admin/ddd";
import { userCanAccessConnection } from "@supa-admin/feature-connections";
import type { PlatformRole } from "@supa-admin/projections";
import {
  type SyncTargetPermissionsResult,
  syncTargetUserPermissions,
} from "@supa-admin/rls";
import { loadConnectionCredentials } from "./internal/connection-credentials";
import { WorkflowError } from "./internal/errors";

export type SyncTargetSessionInput = {
  userId: string;
  role: PlatformRole;
  connectionId: string;
  targetEmail: string;
};

export async function syncTargetSession(
  input: SyncTargetSessionInput,
): Promise<
  Result<SyncTargetPermissionsResult, InstanceType<typeof WorkflowError>>
> {
  const allowed = await userCanAccessConnection(
    input.connectionId,
    input.userId,
    input.role,
  );

  if (!allowed) {
    return err(new WorkflowError("Forbidden", { code: "workflows/forbidden" }));
  }

  const credentials = await loadConnectionCredentials(input.connectionId);
  if (!credentials) {
    return err(WorkflowError.notFound(input.connectionId));
  }

  if (credentials.bootstrapStatus !== "ready") {
    return err(
      new WorkflowError("Target bootstrap is not complete", {
        code: "workflows/precondition-failed",
      }),
    );
  }

  const result = await syncTargetUserPermissions({
    metaUserId: input.userId,
    connectionId: input.connectionId,
    platformRole: input.role,
    targetEmail: input.targetEmail,
    url: credentials.url,
    serviceRoleEnc: credentials.serviceRoleEnc,
  });

  if (!result.success) {
    return err(
      new WorkflowError(result.message, {
        code: "workflows/precondition-failed",
        metadata: { code: result.code },
      }),
    );
  }

  return ok(result);
}
