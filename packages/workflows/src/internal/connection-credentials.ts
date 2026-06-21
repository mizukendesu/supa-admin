import "server-only";
import type { BootstrapStatus } from "@supa-admin/projections";
import {
  createDbContext,
  findConnectionCredentials,
} from "@supa-admin/repository-kit";

export type ConnectionCredentials = {
  url: string;
  serviceRoleEnc: string;
  bootstrapStatus: BootstrapStatus;
};

export async function loadConnectionCredentials(
  connectionId: string,
): Promise<ConnectionCredentials | null> {
  const ctx = await createDbContext({ mode: "service" });
  return findConnectionCredentials(ctx.db, connectionId);
}
