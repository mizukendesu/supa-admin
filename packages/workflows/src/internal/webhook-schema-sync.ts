import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { decrypt } from "@supa-admin/crypto";
import { err, type Result } from "@supa-admin/ddd";
import { checkRateLimit } from "@supa-admin/rate-limit";
import {
  createConnectionRepository,
  createDbContext,
} from "@supa-admin/repository-kit";
import { syncConnectionSchemaWorkflow } from "../sync-connection-schema";
import { WorkflowError } from "./errors";

const SIGNATURE_PREFIX = "sha256=";

function verifyHmac(
  rawBody: string,
  secret: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader?.startsWith(SIGNATURE_PREFIX)) return false;
  const expectedHex = signatureHeader.slice(SIGNATURE_PREFIX.length);
  const computed = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(expectedHex, "hex"),
    );
  } catch {
    return false;
  }
}

export type WebhookSchemaSyncInput = {
  connectionId: string;
  rawBody: string;
  signatureHeader: string | null;
  clientIp: string;
};

export async function webhookSchemaSyncWorkflow(
  input: WebhookSchemaSyncInput,
): Promise<Result<{ tableCount: number }, InstanceType<typeof WorkflowError>>> {
  const rateLimit = await checkRateLimit(
    `webhook:schema-sync:${input.connectionId}:${input.clientIp}`,
    10,
    60,
  );

  if (!rateLimit.allowed) {
    return err(
      new WorkflowError("Rate limit exceeded", {
        code: "workflows/rate-limited",
        metadata: { retryAfterSec: rateLimit.retryAfterSec },
      }),
    );
  }

  const ctx = await createDbContext({ mode: "service" });
  const connections = createConnectionRepository(ctx.db);
  const webhookSecretEnc = await connections.getWebhookSecretEnc(
    input.connectionId,
  );

  if (!webhookSecretEnc) {
    return err(
      new WorkflowError("Unauthorized", { code: "workflows/unauthorized" }),
    );
  }

  const webhookSecret = decrypt(webhookSecretEnc);
  if (!verifyHmac(input.rawBody, webhookSecret, input.signatureHeader)) {
    return err(
      new WorkflowError("Unauthorized", { code: "workflows/unauthorized" }),
    );
  }

  return syncConnectionSchemaWorkflow(input.connectionId);
}
