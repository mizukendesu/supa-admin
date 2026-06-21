import { randomUUID } from "node:crypto";
import { eq, schema, sql } from "@supa-admin/db";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createConnectionRepository } from "../src/connections/repository";
import { createDbContext } from "../src/db-context";

vi.mock("server-only", () => ({}));

const createdConnectionIds: string[] = [];

afterEach(async () => {
  if (createdConnectionIds.length === 0) return;
  const ctx = await createDbContext({ mode: "service" });
  for (const id of createdConnectionIds.splice(0)) {
    await ctx.db
      .delete(schema.connectionTables)
      .where(eq(schema.connectionTables.connectionId, id));
    await ctx.db
      .delete(schema.connections)
      .where(eq(schema.connections.id, id));
  }
});

describe("createDbContext", () => {
  it("when service mode, then returns drizzle client", async () => {
    const ctx = await createDbContext({ mode: "service" });
    expect(ctx.mode).toBe("service");
    expect(ctx.db).toBeDefined();
    expect(typeof ctx.db.select).toBe("function");
  });

  it("when member mode, then sets jwt claim sub", async () => {
    const actorId = randomUUID();
    const ctx = await createDbContext({ mode: "member", actorId });

    expect(ctx.mode).toBe("member");
    expect(ctx.actorId).toBe(actorId);

    const claim = await ctx.run(async (client) => {
      const result = await client.execute(
        sql`SELECT current_setting('request.jwt.claim.sub', true) AS sub`,
      );
      return (result.rows[0] as { sub: string }).sub;
    });

    expect(claim).toBe(actorId);
  });
});

describe("createConnectionRepository", () => {
  it("when create called, then stores encrypted webhook secret", async () => {
    const ctx = await createDbContext({ mode: "service" });

    await ctx.transaction(async (tx) => {
      const repo = createConnectionRepository(tx);
      const connection = await repo.create({
        name: "Test",
        url: "https://example.supabase.co",
        anonKeyEnc: "anon",
        serviceRoleEnc: "service",
      });
      createdConnectionIds.push(connection.id);

      expect(connection.webhook_secret_enc).toBeTruthy();

      const stored = await repo.getWebhookSecretEnc(connection.id);
      expect(stored).toBe(connection.webhook_secret_enc);
    });
  });
});
