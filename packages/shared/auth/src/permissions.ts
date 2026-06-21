import "server-only";
import { createMetaServerClient } from "./meta-server";

export {
  canAccessTable,
  getUserConnectionIds,
  resolveUserPermissions,
} from "@supa-admin/feature-access";
export { isSetupComplete } from "@supa-admin/feature-setup";

export async function getCurrentProfile() {
  const supabase = await createMetaServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function requireAuth() {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  return profile;
}

export async function requirePlatformAdmin() {
  const profile = await requireAuth();
  if (profile.role !== "platform_admin") throw new Error("Forbidden");
  return profile;
}
