import "server-only";

import { getShellData } from "@supa-admin/workflows";
import { os, withAuth } from "../os";

export const appHandlers = os.app.router({
  shell: os.app.shell.use(withAuth).handler(async ({ context }) => {
    return getShellData(context.profile);
  }),
});
