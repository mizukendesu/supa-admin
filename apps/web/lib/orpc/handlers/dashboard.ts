import "server-only";

import { getDashboardStatsWorkflow } from "@supa-admin/workflows";
import { os, withAdmin } from "../os";
import { mapResultToOrpcError } from "./shared";

export const dashboardHandlers = os.dashboard.router({
  stats: os.dashboard.stats.use(withAdmin).handler(async () => {
    const result = await getDashboardStatsWorkflow();
    return mapResultToOrpcError(result);
  }),
});
