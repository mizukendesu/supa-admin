import "server-only";
import { createMetaServerClient } from "@supa-admin/auth/server";
import { createTargetAdminClient } from "@supa-admin/supabase-target/admin";
import { createHash } from "crypto";
import {
  buildBootstrapApplySql,
  buildManualSetupSql,
  isExecSqlMissingError,
} from "./bootstrap-sql";
import { generateRlsSql } from "./generate-sql";
import { buildTargetJwtPermissions } from "./jwt-permissions";

export {
  buildBootstrapApplySql,
  buildManualSetupSql,
  isExecSqlMissingError,
} from "./bootstrap-sql";
export { generateRlsSql } from "./generate-sql";
export { buildTargetJwtPermissions } from "./jwt-permissions";
export {
  getConnectionOnboardingStatus,
  type OnboardingSteps,
} from "./onboarding-status";
export {
  findTargetUserByEmail,
  type SyncTargetPermissionsResult,
  syncTargetUserPermissions,
} from "./sync-target-permissions";

export type BootstrapProbeResult =
  | { ready: true }
  | { ready: false; setupSql: string };

export async function probeTargetBootstrap(
  admin: Pick<ReturnType<typeof createTargetAdminClient>, "rpc">,
): Promise<{ execSqlAvailable: boolean; error?: string }> {
  const { error } = await admin.rpc(
    "exec_sql" as never,
    { query: "SELECT 1" } as never,
  );
  if (!error) return { execSqlAvailable: true };
  if (isExecSqlMissingError(error.message)) {
    return { execSqlAvailable: false };
  }
  return { execSqlAvailable: false, error: error.message };
}

export async function getConnectionTableNames(
  connectionId: string,
): Promise<string[]> {
  const supabase = await createMetaServerClient();
  const { data } = await supabase
    .from("connection_tables")
    .select("table_name")
    .eq("connection_id", connectionId)
    .order("table_name");
  return (data ?? []).map((row) => row.table_name);
}

export async function probeConnectionBootstrap(
  connectionId: string,
  url: string,
  serviceRoleEnc: string,
): Promise<BootstrapProbeResult> {
  const tableNames = await getConnectionTableNames(connectionId);
  const admin = createTargetAdminClient(url, serviceRoleEnc);
  const probe = await probeTargetBootstrap(admin);

  if (probe.execSqlAvailable) {
    return { ready: true };
  }

  return {
    ready: false,
    setupSql: buildManualSetupSql(tableNames),
  };
}

async function markBootstrapReady(connectionId: string) {
  const supabase = await createMetaServerClient();
  await supabase
    .from("connections")
    .update({
      bootstrap_status: "ready",
      bootstrap_verified_at: new Date().toISOString(),
    })
    .eq("id", connectionId);
}

export async function executeTargetBootstrap(
  connectionId: string,
  url: string,
  serviceRoleEnc: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const tableNames = await getConnectionTableNames(connectionId);
  const admin = createTargetAdminClient(url, serviceRoleEnc);
  const probe = await probeTargetBootstrap(admin);

  if (!probe.execSqlAvailable) {
    return {
      success: false,
      error: probe.error ?? "exec_sql is not available on the Target project",
    };
  }

  const sql = buildBootstrapApplySql(tableNames);
  const { error } = await admin.rpc(
    "exec_sql" as never,
    { query: sql } as never,
  );
  if (error) {
    return { success: false, error: error.message };
  }

  await markBootstrapReady(connectionId);
  return { success: true };
}

export async function verifyConnectionBootstrap(
  connectionId: string,
  url: string,
  serviceRoleEnc: string,
): Promise<
  | { success: true; status: "ready" }
  | { success: false; error: string; setupSql?: string }
> {
  const tableNames = await getConnectionTableNames(connectionId);
  const admin = createTargetAdminClient(url, serviceRoleEnc);
  const probe = await probeTargetBootstrap(admin);

  if (!probe.execSqlAvailable) {
    return {
      success: false,
      error:
        probe.error ??
        "exec_sql not found. Run the setup SQL in Target SQL Editor first.",
      setupSql: buildManualSetupSql(tableNames),
    };
  }

  const apply = await executeTargetBootstrap(connectionId, url, serviceRoleEnc);
  if (!apply.success) {
    return { success: false, error: apply.error };
  }

  return { success: true, status: "ready" };
}

export async function assertConnectionBootstrapReady(
  connectionId: string,
): Promise<void> {
  const { createMetaServiceClient } = await import("@supa-admin/auth/server");
  const service = createMetaServiceClient();
  const { data, error } = await service
    .from("connections")
    .select("bootstrap_status")
    .eq("id", connectionId)
    .single();

  if (error || !data) {
    throw new Error("Connection not found");
  }
  if (data.bootstrap_status !== "ready") {
    throw new Error("Target bootstrap is not complete");
  }
}

export async function previewRlsSync(connectionId: string) {
  const supabase = await createMetaServerClient();

  const { data: permissions } = await supabase
    .from("role_permissions")
    .select("*")
    .eq("connection_id", connectionId);

  const { data: roles } = await supabase.from("roles").select("id, name");

  const sql = generateRlsSql(permissions ?? [], roles ?? []);
  const sqlHash = createHash("sha256").update(sql).digest("hex");

  return { sql, sqlHash, permissionCount: permissions?.length ?? 0 };
}

export async function executeRlsSync(
  connectionId: string,
  url: string,
  serviceRoleEnc: string,
  executedBy: string,
) {
  await assertConnectionBootstrapReady(connectionId);
  const { sql, sqlHash } = await previewRlsSync(connectionId);
  const admin = createTargetAdminClient(url, serviceRoleEnc);
  const supabase = await createMetaServerClient();

  try {
    const { error } = await admin.rpc(
      "exec_sql" as never,
      {
        query: sql,
      } as never,
    );
    if (error) throw new Error(error.message);

    await supabase.from("rls_sync_logs").insert({
      connection_id: connectionId,
      executed_by: executedBy,
      sql_hash: sqlHash,
      success: true,
    });

    return { success: true, sql };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase.from("rls_sync_logs").insert({
      connection_id: connectionId,
      executed_by: executedBy,
      sql_hash: sqlHash,
      success: false,
      error_message: message,
    });
    return { success: false, error: message, sql };
  }
}

export async function buildAppMetadataPermissions(
  userId: string,
  connectionId: string,
  platformRole: "platform_admin" | "member" = "member",
) {
  return buildTargetJwtPermissions(userId, connectionId, platformRole);
}
