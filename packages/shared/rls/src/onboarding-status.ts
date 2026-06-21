import "server-only";
import { createMetaServerClient } from "@supa-admin/auth/server";

export type OnboardingSteps = {
  bootstrap: boolean;
  schemaSynced: boolean;
  rolesConfigured: boolean;
  usersProvisioned: boolean;
};

export async function getConnectionOnboardingStatus(
  connectionId: string,
): Promise<{ steps: OnboardingSteps; complete: boolean }> {
  const supabase = await createMetaServerClient();

  const { data: connection } = await supabase
    .from("connections")
    .select("bootstrap_status, schema_cached_at")
    .eq("id", connectionId)
    .single();

  const { count: permissionCount } = await supabase
    .from("role_permissions")
    .select("*", { count: "exact", head: true })
    .eq("connection_id", connectionId);

  const { count: mappingCount } = await supabase
    .from("target_user_mappings")
    .select("*", { count: "exact", head: true })
    .eq("connection_id", connectionId);

  const steps: OnboardingSteps = {
    bootstrap: connection?.bootstrap_status === "ready",
    schemaSynced: connection?.schema_cached_at != null,
    rolesConfigured: (permissionCount ?? 0) > 0,
    usersProvisioned: (mappingCount ?? 0) > 0,
  };

  return {
    steps,
    complete: Object.values(steps).every(Boolean),
  };
}
