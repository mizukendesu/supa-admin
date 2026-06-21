import type { PlatformRole } from "@supa-admin/projections";

/** Profile fields required by shell and connection context workflows. */
export type WorkflowActor = {
  id: string;
  email: string;
  display_name: string | null;
  role: PlatformRole;
  created_at: string;
};
