import "server-only";

import {
  getUserOverrides,
  updateUserOverrides,
} from "@supa-admin/feature-access";
import { os, withAdmin } from "../os";
import { mapResultToOrpcError } from "./shared";

export const accessHandlers = os.access.router({
  getUserOverrides: os.access.getUserOverrides
    .use(withAdmin)
    .handler(async ({ input }) => {
      return mapResultToOrpcError(
        await getUserOverrides(input.userId, input.connectionId),
      );
    }),

  updateUserOverrides: os.access.updateUserOverrides
    .use(withAdmin)
    .handler(async ({ input }) => {
      return mapResultToOrpcError(
        await updateUserOverrides(
          input.userId,
          input.connectionId,
          input.overrides,
        ),
      );
    }),
});
