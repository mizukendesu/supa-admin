import "server-only";
import { createMetaServiceClient } from "@supa-admin/auth/server";
import type { BootstrapStatus } from "@supa-admin/projections";

export async function getConnectionBootstrapStatus(
  connectionId: string,
): Promise<BootstrapStatus | null> {
  const service = createMetaServiceClient();
  const { data, error } = await service
    .from("connections")
    .select("bootstrap_status")
    .eq("id", connectionId)
    .single();

  if (error || !data) return null;
  return data.bootstrap_status as BootstrapStatus;
}

export async function requireConnectionBootstrapReady(
  connectionId: string,
): Promise<void> {
  const status = await getConnectionBootstrapStatus(connectionId);
  if (status !== "ready") {
    throw new Error("Target bootstrap is not complete");
  }
}
