import { err, ok } from "@supa-admin/ddd";
import { CustomError } from "@supa-admin/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SIGNATURE_HEADER } from "@/lib/webhooks/verify-hmac";

vi.mock("server-only", () => ({}));

vi.mock("@supa-admin/workflows", () => ({
  webhookSchemaSyncWorkflow: vi.fn(),
}));

describe("POST /api/webhooks/schema-sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await import("@/app/api/webhooks/schema-sync/route.js");
    const response = await POST(
      new Request("http://localhost/api/webhooks/schema-sync", {
        method: "POST",
        body: "not-json",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 401 when workflow rejects unauthorized", async () => {
    const { webhookSchemaSyncWorkflow } = await import("@supa-admin/workflows");
    vi.mocked(webhookSchemaSyncWorkflow).mockResolvedValue(
      err(new CustomError("Unauthorized", { code: "workflows/unauthorized" })),
    );

    const body = JSON.stringify({
      connectionId: "00000000-0000-4000-8000-000000000001",
    });
    const { POST } = await import("@/app/api/webhooks/schema-sync/route.js");
    const response = await POST(
      new Request("http://localhost/api/webhooks/schema-sync", {
        method: "POST",
        headers: { [SIGNATURE_HEADER]: "sha256=deadbeef" },
        body,
      }),
    );
    expect(response.status).toBe(401);
  });

  it("returns 200 with tableCount on success", async () => {
    const { webhookSchemaSyncWorkflow } = await import("@supa-admin/workflows");
    vi.mocked(webhookSchemaSyncWorkflow).mockResolvedValue(
      ok({ success: true as const, tableCount: 5 }),
    );

    const body = JSON.stringify({
      connectionId: "00000000-0000-4000-8000-000000000001",
    });

    const { POST } = await import("@/app/api/webhooks/schema-sync/route.js");
    const response = await POST(
      new Request("http://localhost/api/webhooks/schema-sync", {
        method: "POST",
        body,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      tableCount: 5,
    });
  });

  it("returns 429 when rate limited", async () => {
    const { webhookSchemaSyncWorkflow } = await import("@supa-admin/workflows");
    vi.mocked(webhookSchemaSyncWorkflow).mockResolvedValue(
      err(
        new CustomError("Rate limit exceeded", {
          code: "workflows/rate-limited",
          metadata: { retryAfterSec: 30 },
        }),
      ),
    );

    const body = JSON.stringify({
      connectionId: "00000000-0000-4000-8000-000000000001",
    });
    const { POST } = await import("@/app/api/webhooks/schema-sync/route.js");
    const response = await POST(
      new Request("http://localhost/api/webhooks/schema-sync", {
        method: "POST",
        body,
      }),
    );
    expect(response.status).toBe(429);
  });
});
