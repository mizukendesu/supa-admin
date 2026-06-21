import "server-only";
import { randomBytes } from "node:crypto";
import { decrypt, encrypt } from "@supa-admin/crypto";
import { err, ok, type Result } from "@supa-admin/ddd";
import {
  createConnectionRepository,
  createDbContext,
} from "@supa-admin/repository-kit";
import { ConnectionsFeatureError } from "../errors";

/** Decrypts the current webhook secret once, then rotates to a new value. */
export async function revealWebhookSecret(connectionId: string) {
  const ctx = await createDbContext({ mode: "service" });
  const repo = createConnectionRepository(ctx.db);
  const encrypted = await repo.getWebhookSecretEnc(connectionId);

  if (!encrypted) {
    return err(ConnectionsFeatureError.notFound(connectionId));
  }

  const webhookSecret = decrypt(encrypted);

  await repo.setWebhookSecretEnc(
    connectionId,
    encrypt(randomBytes(32).toString("hex")),
  );

  return ok({ webhookSecret });
}

export type RevealWebhookSecretResult = Result<
  { webhookSecret: string },
  InstanceType<typeof ConnectionsFeatureError>
>;
