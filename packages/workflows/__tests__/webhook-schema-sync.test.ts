import { ok } from "@supa-admin/ddd";
import { describe, expect, it, vi } from "vitest";
import { webhookSchemaSyncWorkflow } from "../src/internal/webhook-schema-sync";

vi.mock("server-only", () => ({}));

vi.mock("@supa-admin/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
}));

vi.mock("@supa-admin/crypto", () => ({
  decrypt: vi.fn(() => "secret"),
}));

vi.mock("@supa-admin/repository-kit", () => ({
  createDbContext: vi.fn(async () => ({ db: {}, mode: "service" })),
  createConnectionRepository: vi.fn(() => ({
    getWebhookSecretEnc: vi.fn().mockResolvedValue("enc-secret"),
  })),
}));

vi.mock("../src/sync-connection-schema", () => ({
  syncConnectionSchemaWorkflow: vi.fn(async () =>
    ok({ success: true as const, tableCount: 3 }),
  ),
}));

describe("webhookSchemaSyncWorkflow", () => {
  it("when signature invalid, then returns unauthorized", async () => {
    const result = await webhookSchemaSyncWorkflow({
      connectionId: "00000000-0000-4000-8000-000000000001",
      rawBody: JSON.stringify({
        connectionId: "00000000-0000-4000-8000-000000000001",
      }),
      signatureHeader: "sha256=deadbeef",
      clientIp: "127.0.0.1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("workflows/unauthorized");
    }
  });

  it("when rate limited, then returns rate-limited error", async () => {
    const { checkRateLimit } = await import("@supa-admin/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false,
      retryAfterSec: 30,
    });

    const result = await webhookSchemaSyncWorkflow({
      connectionId: "00000000-0000-4000-8000-000000000001",
      rawBody: "{}",
      signatureHeader: null,
      clientIp: "127.0.0.1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("workflows/rate-limited");
    }
  });
});
