import "server-only";

import { ok, type Result } from "@supa-admin/ddd";
import { updateRolePermissions } from "@supa-admin/feature-access";
import type { PermissionRow } from "@supa-admin/projections";
import { executeRlsSync } from "@supa-admin/rls";
import { loadConnectionCredentials } from "./internal/connection-credentials";

export type UpdateRolePermissionsInput = {
  roleId: string;
  connectionId: string;
  permissions: PermissionRow[];
  executedBy: string;
};

export type UpdateRolePermissionsResult = {
  success: true;
  rlsSync: { success: true } | { success: false; error: string };
};

export async function updateRolePermissionsWorkflow(
  input: UpdateRolePermissionsInput,
): Promise<Result<UpdateRolePermissionsResult, Error>> {
  const updateResult = await updateRolePermissions(
    input.roleId,
    input.connectionId,
    input.permissions,
  );

  if (!updateResult.ok) {
    return updateResult;
  }

  const credentials = await loadConnectionCredentials(input.connectionId);

  if (!credentials || credentials.bootstrapStatus !== "ready") {
    return ok({
      success: true as const,
      rlsSync: {
        success: false,
        error: "Target bootstrap is not complete",
      },
    });
  }

  const rlsResult = await executeRlsSync(
    input.connectionId,
    credentials.url,
    credentials.serviceRoleEnc,
    input.executedBy,
  );

  return ok({
    success: true as const,
    rlsSync: rlsResult.success
      ? { success: true }
      : { success: false, error: rlsResult.error ?? "RLS sync failed" },
  });
}
