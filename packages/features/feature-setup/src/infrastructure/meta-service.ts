import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createMetaServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_META_SUPABASE_URL!,
    process.env.META_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
