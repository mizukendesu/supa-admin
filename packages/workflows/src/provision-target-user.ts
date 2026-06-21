import "server-only";

import {
  type ProvisionTargetUserInput,
  type ProvisionTargetUserResult,
  provisionTargetUser,
} from "@supa-admin/feature-users";

export type { ProvisionTargetUserInput, ProvisionTargetUserResult };

export async function provisionTargetUserWorkflow(
  input: ProvisionTargetUserInput,
): Promise<ProvisionTargetUserResult> {
  return provisionTargetUser(input);
}
