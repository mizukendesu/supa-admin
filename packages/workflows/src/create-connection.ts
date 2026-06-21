import "server-only";

import {
  type CreateConnectionInput,
  type CreateConnectionResult,
  createConnection,
} from "@supa-admin/feature-connections";

export type { CreateConnectionInput, CreateConnectionResult };

export type CreateConnectionWorkflowResult = Awaited<
  ReturnType<typeof createConnection>
>;

export async function createConnectionWorkflow(
  input: CreateConnectionInput,
): Promise<CreateConnectionWorkflowResult> {
  return createConnection(input);
}
