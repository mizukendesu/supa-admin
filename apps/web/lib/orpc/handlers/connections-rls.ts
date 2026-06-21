import "server-only";

import {
  applyConnectionRls,
  previewConnectionRls,
} from "@supa-admin/feature-connections";
import { os, withAdmin } from "../os";
import { mapThrownToOrpcError } from "./shared";

export const connectionsRlsHandlers = os.connectionsRls.router({
  preview: os.connectionsRls.preview
    .use(withAdmin)
    .handler(async ({ input }) => {
      return previewConnectionRls(input.id);
    }),

  apply: os.connectionsRls.apply
    .use(withAdmin)
    .handler(async ({ input, context }) => {
      try {
        return await applyConnectionRls(input.id, context.profile.id);
      } catch (error) {
        mapThrownToOrpcError(error);
      }
    }),
});
