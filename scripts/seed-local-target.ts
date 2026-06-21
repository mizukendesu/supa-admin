import { createCipheriv, randomBytes } from "node:crypto";
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

const url = process.env.LOCAL_TARGET_SUPABASE_URL ?? "http://127.0.0.1:54421";
const anonKey = process.env.LOCAL_TARGET_SUPABASE_ANON_KEY;
const serviceKey = process.env.LOCAL_TARGET_SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const encKey = process.env.ENCRYPTION_KEY;

if (!anonKey || !serviceKey || !encKey) {
  console.error("Missing env vars — run pnpm setup:env-local first");
  process.exit(1);
}

async function main() {
  const db = createClient(databaseUrl);

  try {
    const existing = await db
      .select({
        id: schema.connections.id,
        webhookSecretEnc: schema.connections.webhookSecretEnc,
      })
      .from(schema.connections)
      .limit(1);

    if (existing.length > 0) {
      if (!existing[0]?.webhookSecretEnc) {
        await db
          .update(schema.connections)
          .set({
            webhookSecretEnc: encrypt(randomBytes(32).toString("hex"), encKey),
          })
          .where(eq(schema.connections.id, existing[0]!.id));
        console.log("Backfilled webhook secret on existing connection");
      } else {
        console.log("Connection already seeded");
      }
      return;
    }

    await db.insert(schema.connections).values({
      name: "Local Target",
      url,
      anonKeyEnc: encrypt(anonKey, encKey),
      serviceRoleEnc: encrypt(serviceKey, encKey),
      webhookSecretEnc: encrypt(randomBytes(32).toString("hex"), encKey),
    });

    const [created] = await db
      .select({ id: schema.connections.id })
      .from(schema.connections)
      .where(eq(schema.connections.name, "Local Target"))
      .limit(1);

    console.log(`Seeded Local Target connection (${created?.id ?? "unknown"})`);
  } finally {
    await getRawClient(db).end();
  }
}

void main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
