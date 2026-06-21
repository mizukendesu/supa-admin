import "server-only";

import { ORPCError } from "@orpc/server";
import { createAdmin, isSetupComplete } from "@supa-admin/feature-setup";
import { env } from "@/lib/env";
import { os } from "../os";
import { verifySetupSecret } from "../verify-setup-secret";
import { assertRateLimit, mapResultToOrpcError } from "./shared";

export const setupHandlers = os.setup.router({
  createAdmin: os.setup.createAdmin.handler(async ({ input, context }) => {
    await assertRateLimit(`setup:create:${context.clientIp}`, 5, 3600);
    verifySetupSecret(input.setupSecret, env.SETUP_SECRET);

    const result = await createAdmin({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
    });

    if (!result.ok && result.error.code === "feature-setup/already-complete") {
      throw new ORPCError("BAD_REQUEST", { message: result.error.message });
    }

    return mapResultToOrpcError(result);
  }),

  isComplete: os.setup.isComplete.handler(async ({ context }) => {
    await assertRateLimit(`setup:check:${context.clientIp}`, 30, 60);
    return { complete: await isSetupComplete() };
  }),
});
