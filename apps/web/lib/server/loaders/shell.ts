import "server-only";

import {
  type GetConnectionContextResult,
  type GetShellDataResult,
  getConnectionContext as getConnectionContextWorkflow,
  getShellData as getShellDataWorkflow,
} from "@supa-admin/workflows";
import { headers } from "next/headers";
import { cache } from "react";
import { getCurrentProfile } from "@/lib/permissions";

export type { GetConnectionContextResult, GetShellDataResult };

export const getShellData = cache(
  async (): Promise<GetShellDataResult | null> => {
    const profile = await getCurrentProfile();
    if (!profile) return null;
    return getShellDataWorkflow(profile);
  },
);

export const getConnectionContext = cache(
  async (
    profile: NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>>,
    connectionId: string,
  ): Promise<GetConnectionContextResult | null> => {
    const result = await getConnectionContextWorkflow(
      connectionId,
      profile.id,
      profile.role,
    );
    if (!result.ok) return null;
    return result.value;
  },
);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseConnectionIdFromPathname(
  pathname: string,
): string | undefined {
  const segments = pathname.split("/").filter(Boolean);
  const locales = new Set(["ja", "en"]);
  const start = segments[0] && locales.has(segments[0]) ? 1 : 0;
  const candidate = segments[start];
  return candidate && UUID_PATTERN.test(candidate) ? candidate : undefined;
}

export async function getConnectionIdFromHeaders(): Promise<
  string | undefined
> {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";
  return parseConnectionIdFromPathname(pathname);
}
