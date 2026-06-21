import "server-only";

import { listAccessibleConnections } from "@supa-admin/feature-connections";
import type { WorkflowActor } from "./internal/actor";

export type GetShellDataResult = {
  profile: {
    id: string;
    email: string;
    display_name: string | null;
    role: WorkflowActor["role"];
    created_at: string;
  };
  connections: Array<{ id: string; name: string }>;
};

export async function getShellData(
  profile: WorkflowActor,
): Promise<GetShellDataResult> {
  const connections = await listAccessibleConnections(profile.id, profile.role);

  return {
    profile: {
      id: profile.id,
      email: profile.email,
      display_name: profile.display_name,
      role: profile.role,
      created_at: profile.created_at,
    },
    connections: connections
      .map((connection) => ({ id: connection.id, name: connection.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
