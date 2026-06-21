import "server-only";
import { randomBytes } from "node:crypto";
import { encrypt } from "@supa-admin/crypto";
import { err, ok, type Result } from "@supa-admin/ddd";
import {
  createConnectionRepository,
  createDbContext,
} from "@supa-admin/repository-kit";
import { ConnectionsFeatureError } from "../errors";

export async function rotateWebhookSecret(connectionId: string) {
  const ctx = await createDbContext({ mode: "service" });
  const repo = createConnectionRepository(ctx.db);
  const plaintext = randomBytes(32).toString("hex");
  const updated = await repo.setWebhookSecretEnc(
    connectionId,
    encrypt(plaintext),
  );

  if (!updated) {
    return err(ConnectionsFeatureError.notFound(connectionId));
  }

  return ok({ webhookSecret: plaintext });
}

export type RotateWebhookSecretResult = Result<
  { webhookSecret: string },
  InstanceType<typeof ConnectionsFeatureError>
>;
