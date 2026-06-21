import { getConnectionOnboardingStatus } from "@supa-admin/rls";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/routing";
import { getConnectionBootstrapStatus } from "@/lib/connection-bootstrap";
import {
  getCurrentProfile,
  getUserConnectionIds,
  resolveUserPermissions,
} from "@/lib/permissions";

export default async function ConnectionIndexPage({
  params,
}: {
  params: Promise<{ locale: string; connectionId: string }>;
}) {
  const { locale, connectionId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const allowedIds = await getUserConnectionIds(profile.id, profile.role);
  if (!allowedIds.includes(connectionId)) notFound();

  const bootstrapStatus = await getConnectionBootstrapStatus(connectionId);
  if (bootstrapStatus !== "ready") {
    redirect({ href: `/${connectionId}/setup`, locale });
  }

  if (profile.role === "platform_admin") {
    const onboarding = await getConnectionOnboardingStatus(connectionId);
    if (!onboarding.complete) {
      redirect({ href: `/${connectionId}/setup`, locale });
    }
  }

  const permissions = await resolveUserPermissions(
    profile.id,
    connectionId,
    profile.role,
  );
  const firstTable = permissions.find((p) => p.can_read);

  if (firstTable) {
    redirect({ href: `/${connectionId}/${firstTable.table_name}`, locale });
  }

  redirect({ href: `/${connectionId}/connect`, locale });
}
