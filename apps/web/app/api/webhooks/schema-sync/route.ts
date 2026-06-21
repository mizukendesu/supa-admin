import "server-only";

import { webhookSchemaSyncWorkflow } from "@supa-admin/workflows";
import { NextResponse } from "next/server";
import { z } from "zod/v3";
import { SIGNATURE_HEADER } from "@/lib/webhooks/verify-hmac";

export const maxDuration = 120;

const payloadSchema = z.object({
  connectionId: z.string().uuid(),
});

function resolveClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  let payload: z.infer<typeof payloadSchema>;

  try {
    payload = payloadSchema.parse(JSON.parse(rawBody));
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const result = await webhookSchemaSyncWorkflow({
    connectionId: payload.connectionId,
    rawBody,
    signatureHeader: request.headers.get(SIGNATURE_HEADER),
    clientIp: resolveClientIp(request),
  });

  if (!result.ok) {
    if (result.error.code === "workflows/rate-limited") {
      return NextResponse.json(
        {
          error: result.error.message,
          retryAfterSec: result.error.metadata?.retryAfterSec,
        },
        { status: 429 },
      );
    }
    if (result.error.code === "workflows/unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const status = result.error.code.endsWith("/not-found") ? 404 : 400;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json(
    { success: true, tableCount: result.value.tableCount },
    { status: 200 },
  );
}
