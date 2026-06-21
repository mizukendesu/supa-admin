const EXEC_SQL_FUNCTION = `CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void AS $$
BEGIN
  EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;`;

const PERMISSION_HELPER_FUNCTION = `CREATE OR REPLACE FUNCTION public.supaadmin_has_permission(
  p_table text,
  p_action text
) RETURNS boolean AS $$
DECLARE
  perms jsonb;
BEGIN
  perms := (auth.jwt() -> 'app_metadata' -> 'permissions');
  IF perms IS NULL THEN RETURN false; END IF;
  RETURN COALESCE((perms -> p_table ->> p_action)::boolean, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.supaadmin_has_permission(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.supaadmin_has_permission(text, text) TO authenticated, anon;`;

function buildGrantSql(tableNames: string[]): string {
  if (tableNames.length === 0) {
    return `-- No synced tables yet; run schema sync then re-apply bootstrap
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, anon;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, anon;`;
  }

  const quoted = tableNames.map((t) => `"${t.replace(/"/g, '""')}"`).join(", ");
  return `GRANT SELECT, INSERT, UPDATE, DELETE ON ${quoted} TO authenticated, anon;`;
}

/** Full one-time SQL for Target SQL Editor when exec_sql is not installed yet. */
export function buildManualSetupSql(tableNames: string[]): string {
  return [
    "-- SupaAdmin Target bootstrap (run once in Target SQL Editor)",
    "-- SECURITY: exec_sql runs arbitrary SQL as SECURITY DEFINER.",
    "-- Only service_role may EXECUTE it. Never expose service_role keys in client code.",
    "",
    EXEC_SQL_FUNCTION,
    "",
    PERMISSION_HELPER_FUNCTION,
    "",
    buildGrantSql(tableNames),
  ].join("\n");
}

/** Idempotent SQL applied via exec_sql RPC after exec_sql exists. */
export function buildBootstrapApplySql(tableNames: string[]): string {
  return [PERMISSION_HELPER_FUNCTION, "", buildGrantSql(tableNames)].join("\n");
}

export function isExecSqlMissingError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("exec_sql") &&
    (lower.includes("could not find") ||
      lower.includes("does not exist") ||
      lower.includes("not found") ||
      lower.includes("pgrst202"))
  );
}
