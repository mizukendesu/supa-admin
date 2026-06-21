import "server-only";
import {
  createDbContext,
  createUsersRepository,
} from "@supa-admin/repository-kit";

export async function listUsers() {
  const ctx = await createDbContext({ mode: "service" });
  const users = createUsersRepository(ctx.db);
  return users.listProfiles();
}
