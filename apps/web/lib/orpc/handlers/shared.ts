import "server-only";

import { ORPCError } from "@orpc/server";
import type { Result } from "@supa-admin/ddd";
import { CustomError } from "@supa-admin/errors";
import { getUserConnectionIds } from "@supa-admin/feature-access";
import type { BootstrapStatus } from "@supa-admin/projections";
import { checkRateLimit } from "@supa-admin/rate-limit";

type OrpcErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "PRECONDITION_FAILED"
  | "INTERNAL_SERVER_ERROR"
  | "TOO_MANY_REQUESTS";

function orpcCodeFromErrorCode(code: string): OrpcErrorCode {
  if (code.endsWith("/not-found")) return "NOT_FOUND";
  if (code.endsWith("/forbidden") || code === "workflows/forbidden") {
    return "FORBIDDEN";
  }
  if (
    code.endsWith("/precondition-failed") ||
    code === "workflows/precondition-failed"
  ) {
    return "PRECONDITION_FAILED";
  }
  if (
    code.endsWith("/already-complete") ||
    code.endsWith("/invalid-url") ||
    code.endsWith("/invalid-state")
  ) {
    return "BAD_REQUEST";
  }
  return "BAD_REQUEST";
}

export async function assertRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<void> {
  const result = await checkRateLimit(key, limit, windowSec);
  if (!result.allowed) {
    throw new ORPCError("TOO_MANY_REQUESTS", {
      message: "Rate limit exceeded",
      data: { retryAfterSec: result.retryAfterSec },
    });
  }
}

type MappableError = {
  code: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export function mapResultToOrpcError<T>(
  result: Result<T, MappableError | Error>,
): T {
  if (result.ok) {
    return result.value;
  }

  if (result.error instanceof CustomError) {
    throw new ORPCError(orpcCodeFromErrorCode(result.error.code), {
      message: result.error.message,
      data: result.error.metadata,
    });
  }

  if ("code" in result.error && typeof result.error.code === "string") {
    throw new ORPCError(orpcCodeFromErrorCode(result.error.code), {
      message: result.error.message,
      data:
        "metadata" in result.error
          ? (result.error.metadata as Record<string, unknown> | undefined)
          : undefined,
    });
  }

  throw new ORPCError("INTERNAL_SERVER_ERROR", {
    message: result.error.message,
  });
}

export function mapThrownToOrpcError(error: unknown): never {
  if (error instanceof CustomError) {
    throw new ORPCError(orpcCodeFromErrorCode(error.code), {
      message: error.message,
      data: error.metadata,
    });
  }

  throw error;
}

export async function requireConnectionMembership(
  connectionId: string,
  userId: string,
  role: "platform_admin" | "member",
): Promise<void> {
  const allowedIds = await getUserConnectionIds(userId, role);
  if (!allowedIds.includes(connectionId)) {
    throw new ORPCError("FORBIDDEN", { message: "Forbidden" });
  }
}

export function pickConnectionSummary(connection: {
  id: string;
  name: string;
  url: string;
  schema_cached_at: string | null;
  bootstrap_status: BootstrapStatus;
  bootstrap_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}) {
  return {
    id: connection.id,
    name: connection.name,
    url: connection.url,
    schema_cached_at: connection.schema_cached_at,
    bootstrap_status: connection.bootstrap_status,
    bootstrap_verified_at: connection.bootstrap_verified_at ?? null,
    ...(connection.created_at !== undefined
      ? { created_at: connection.created_at }
      : {}),
    ...(connection.updated_at !== undefined
      ? { updated_at: connection.updated_at }
      : {}),
  };
}
