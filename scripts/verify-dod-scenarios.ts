/**
 * Verifies webhook-related Definition-of-Done scenarios (14–16).
 * Requires dev server on NEXT_PUBLIC_APP_URL and a seeded connection with webhook_secret_enc.
 */
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, eq, getRawClient, schema } from "@supa-admin/db";

function loadEnv() {
  const envPath = join(process.cwd(), "apps/web/.env.local");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) process.env[match[1]!] = match[2]!.replace(/^"|"$/g, "");
  }
}

function decrypt(ciphertext: string, hexKey: string): string {
  const key = Buffer.from(hexKey, "hex");
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}

function encrypt(plaintext: string, hexKey: string): string {
  const key = Buffer.from(hexKey, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

loadEnv();

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000";
const encKey = process.env.ENCRYPTION_KEY!;

async function assertScenario(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

async function postWebhook(
  connectionId: string,
  secret: string,
): Promise<Response> {
  const body = JSON.stringify({ connectionId });
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  return fetch(`${baseUrl}/api/webhooks/schema-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SupaAdmin-Signature": signature,
    },
    body,
  });
}

async function main() {
  const db = createClient(
    process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  );

  try {
    const [connection] = await db
      .select({
        id: schema.connections.id,
        webhookSecretEnc: schema.connections.webhookSecretEnc,
      })
      .from(schema.connections)
      .limit(1);

    if (!connection?.id || !connection.webhookSecretEnc) {
      throw new Error(
        "Seed a local connection first: pnpm exec tsx scripts/seed-local-target.ts",
      );
    }

    const webhookSecret = decrypt(connection.webhookSecretEnc, encKey);

    await assertScenario(
      "14. CI Webhook schema sync (valid HMAC)",
      async () => {
        const response = await postWebhook(connection.id, webhookSecret);
        if (!response.ok) {
          throw new Error(
            `Expected 200, got ${response.status}: ${await response.text()}`,
          );
        }
        const json = (await response.json()) as {
          success?: boolean;
          tableCount?: number;
        };
        if (!json.success || typeof json.tableCount !== "number") {
          throw new Error(`Unexpected body: ${JSON.stringify(json)}`);
        }
      },
    );

    await assertScenario("15. CI Webhook invalid secret → 401", async () => {
      const body = JSON.stringify({ connectionId: connection.id });
      const badSig = `sha256=${createHmac("sha256", "wrong-secret").update(body).digest("hex")}`;
      const response = await fetch(`${baseUrl}/api/webhooks/schema-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SupaAdmin-Signature": badSig,
        },
        body,
      });
      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}`);
      }
    });

    await assertScenario(
      "16. webhook secret rotate → old 401, new 200",
      async () => {
        const newSecret = randomBytes(32).toString("hex");
        await db
          .update(schema.connections)
          .set({ webhookSecretEnc: encrypt(newSecret, encKey) })
          .where(eq(schema.connections.id, connection.id));

        const oldResponse = await postWebhook(connection.id, webhookSecret);
        if (oldResponse.status !== 401) {
          throw new Error(
            `Expected 401 after rotate with old secret, got ${oldResponse.status}`,
          );
        }

        const newResponse = await postWebhook(connection.id, newSecret);
        if (!newResponse.ok) {
          throw new Error(
            `Expected 200 with new secret, got ${newResponse.status}: ${await newResponse.text()}`,
          );
        }
      },
    );

    console.log("\nWebhook DoD scenarios passed (14–16).");
  } finally {
    await getRawClient(db).end();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
