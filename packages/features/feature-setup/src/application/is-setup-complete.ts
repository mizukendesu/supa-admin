import "server-only";
import {
  createDbContext,
  createSetupRepository,
} from "@supa-admin/repository-kit";

export async function isSetupComplete(): Promise<boolean> {
  const ctx = await createDbContext({ mode: "service" });
  const setup = createSetupRepository(ctx.db);
  return setup.isSetupComplete();
}
