import "server-only";

import type { SyncConnectionSchemaResult } from "@supa-admin/feature-connections";
import { syncConnectionSchema } from "@supa-admin/feature-connections";

export async function syncConnectionSchemaWorkflow(
  connectionId: string,
): Promise<SyncConnectionSchemaResult> {
  return syncConnectionSchema(connectionId);
}
