import "server-only";

import { previewRlsSync } from "@supa-admin/rls";

export async function previewConnectionRls(connectionId: string) {
  return previewRlsSync(connectionId);
}
