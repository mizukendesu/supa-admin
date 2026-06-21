import "server-only";

import { provisionTargetUserWorkflow } from "@supa-admin/workflows";
import { os, withAdmin } from "../os";
import { mapResultToOrpcError } from "./shared";

export const provisionHandlers = os.provision.router({
  createUser: os.provision.createUser
    .use(withAdmin)
    .handler(async ({ input }) => {
      return mapResultToOrpcError(
        await provisionTargetUserWorkflow({
          userId: input.userId,
          connectionId: input.connectionId,
          email: input.email,
          password: input.password,
        }),
      );
    }),
});
