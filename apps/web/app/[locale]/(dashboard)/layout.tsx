import { setRequestLocale } from "next-intl/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { redirect } from "@/i18n/routing";
import {
  getConnectionContext,
  getConnectionIdFromHeaders,
  getShellData,
} from "@/lib/server/loaders/shell";
import type { Profile } from "@/lib/types/database";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const shellData = await getShellData();
  if (!shellData) {
    redirect({ href: "/login", locale });
  }

  const profile = shellData!.profile as Profile;
  const connections = shellData!.connections;
  const connectionId = await getConnectionIdFromHeaders();
  const connectionContext = connectionId
    ? await getConnectionContext(profile, connectionId)
    : null;

  return (
    <DashboardShell
      profile={profile}
      connections={connections}
      connectionContext={
        connectionContext
          ? {
              connectionName: connectionContext.connection.name,
              tablePermissions: connectionContext.permissions,
            }
          : undefined
      }
    >
      {children}
    </DashboardShell>
  );
}
