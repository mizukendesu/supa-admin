import "server-only";

import { ok, type Result } from "@supa-admin/ddd";
import { resolveUserPermissions } from "@supa-admin/feature-access";
import { getAccessibleConnection } from "@supa-admin/feature-connections";
import type {
  ConnectionTable,
  PlatformRole,
  ResolvedPermission,
} from "@supa-admin/projections";

export type GetConnectionContextResult = {
  connection: {
    id: string;
    name: string;
    url: string;
    bootstrap_status: "pending" | "ready";
  };
  tables: ConnectionTable[];
  permissions: ResolvedPermission[];
};

export async function getConnectionContext(
  connectionId: string,
  userId: string,
  role: PlatformRole,
): Promise<Result<GetConnectionContextResult, Error>> {
  const accessible = await getAccessibleConnection(connectionId, userId, role);
  if (!accessible.ok) {
    return accessible;
  }

  const permissions = await resolveUserPermissions(userId, connectionId, role);

  return ok({
    connection: accessible.value.connection,
    tables: accessible.value.tables,
    permissions,
  });
}
