import { getConnectionOnboardingStatus } from "@supa-admin/rls";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ConnectionOnboardingWizard } from "@/components/connections/connection-onboarding-wizard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { redirect } from "@/i18n/routing";
import { getConnectionBootstrapStatus } from "@/lib/connection-bootstrap";
import {
  getCurrentProfile,
  getUserConnectionIds,
  requirePlatformAdmin,
} from "@/lib/permissions";
import { createMetaServerClient } from "@/lib/supabase/meta/server";

export default async function TargetSetupPage({
  params,
}: {
  params: Promise<{ locale: string; connectionId: string }>;
}) {
  const { locale, connectionId } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentProfile();
  if (!profile) return null;

  const allowedIds = await getUserConnectionIds(profile.id, profile.role);
  if (!allowedIds.includes(connectionId)) notFound();

  const bootstrapStatus = await getConnectionBootstrapStatus(connectionId);
  const t = await getTranslations();

  const supabase = await createMetaServerClient();
  const connectionSource =
    profile.role === "platform_admin" ? "connections" : "connections_member";
  const { data: connection } = await supabase
    .from(connectionSource)
    .select("id, name, url")
    .eq("id", connectionId)
    .single();

  if (!connection) notFound();

  const { data: connections } = await supabase
    .from(connectionSource)
    .select("id, name");

  let isAdmin = false;
  try {
    await requirePlatformAdmin();
    isAdmin = true;
  } catch {
    isAdmin = false;
  }

  if (bootstrapStatus !== "ready" && !isAdmin) {
    return (
      <DashboardShell
        profile={profile}
        connections={connections ?? []}
        activeConnectionId={connectionId}
      >
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-2xl font-bold">
            {t("connections.bootstrap.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("connections.bootstrap.blockedDescription", {
              name: connection.name,
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("connections.bootstrap.contactAdmin")}
          </p>
        </div>
      </DashboardShell>
    );
  }

  if (bootstrapStatus === "ready") {
    const onboarding = await getConnectionOnboardingStatus(connectionId);
    if (onboarding.complete) {
      redirect({ href: `/${connectionId}`, locale });
    }
  }

  if (!isAdmin) {
    notFound();
  }

  const onboarding = await getConnectionOnboardingStatus(connectionId);

  return (
    <DashboardShell
      profile={profile}
      connections={connections ?? []}
      activeConnectionId={connectionId}
    >
      <ConnectionOnboardingWizard
        connectionId={connectionId}
        connectionName={connection.name}
        steps={onboarding.steps}
        showBootstrap={bootstrapStatus !== "ready"}
      />
    </DashboardShell>
  );
}
