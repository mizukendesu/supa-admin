import "server-only";

import { cache } from "react";
import { router } from "@/lib/orpc/router";
import { getServerCaller } from "@/lib/orpc/server-caller";
import {
  getShellData,
  getConnectionContext as loadConnectionContext,
} from "@/lib/server/loaders/shell";
import type {
  BootstrapStatus,
  Profile,
  ResolvedPermission,
} from "@/lib/types/database";

export {
  getConnectionContext,
  getShellData,
} from "@/lib/server/loaders/shell";

export const getShellProfile = cache(async (): Promise<Profile | null> => {
  const data = await getShellData();
  return (data?.profile as Profile | undefined) ?? null;
});

export const getShellConnections = cache(
  async (): Promise<Array<{ id: string; name: string }>> => {
    const data = await getShellData();
    return data?.connections ?? [];
  },
);

export async function getShellTablePermissions(
  connectionId: string,
): Promise<ResolvedPermission[]> {
  const data = await getShellData();
  if (!data?.profile) return [];
  const ctx = await loadConnectionContext(data.profile, connectionId);
  return ctx?.permissions ?? [];
}

export async function getConnectionBootstrapStatus(
  connectionId: string,
): Promise<BootstrapStatus | null> {
  try {
    const { call } = await getServerCaller();
    const { connection } = await call(router.connections.getAccessible, {
      id: connectionId,
    });
    return connection.bootstrap_status;
  } catch {
    return null;
  }
}
