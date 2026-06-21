import "server-only";

import { err, ok, type Result } from "@supa-admin/ddd";
import { userCanAccessConnection } from "@supa-admin/feature-connections";
import type { PlatformRole } from "@supa-admin/projections";
import {
  getConnectionOnboardingStatus,
  type OnboardingSteps,
} from "@supa-admin/rls";
import { WorkflowError } from "./internal/errors";

export type CompleteOnboardingResult = {
  steps: OnboardingSteps;
  complete: boolean;
};

export async function completeOnboarding(
  connectionId: string,
  userId: string,
  role: PlatformRole,
): Promise<
  Result<CompleteOnboardingResult, InstanceType<typeof WorkflowError>>
> {
  const allowed = await userCanAccessConnection(connectionId, userId, role);
  if (!allowed) {
    return err(new WorkflowError("Forbidden", { code: "workflows/forbidden" }));
  }

  const status = await getConnectionOnboardingStatus(connectionId);
  return ok(status);
}
