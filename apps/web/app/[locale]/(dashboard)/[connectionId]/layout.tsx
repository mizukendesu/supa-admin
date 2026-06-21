import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getUserConnectionIds } from "@/lib/permissions";
import { getShellProfile } from "@/lib/shell-data";

export default async function ConnectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; connectionId: string }>;
}) {
  const { locale, connectionId } = await params;
  setRequestLocale(locale);

  const profile = await getShellProfile();
  if (!profile) notFound();

  const allowedIds = await getUserConnectionIds(profile.id, profile.role);
  if (!allowedIds.includes(connectionId)) notFound();

  return children;
}
