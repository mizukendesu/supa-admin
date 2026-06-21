import "server-only";
import { err, ok } from "@supa-admin/ddd";
import {
  createDbContext,
  createUsersRepository,
} from "@supa-admin/repository-kit";
import { UsersFeatureError } from "../errors";

export async function getUser(id: string) {
  const ctx = await createDbContext({ mode: "service" });
  const users = createUsersRepository(ctx.db);

  const profile = await users.findProfileById(id);
  if (!profile) {
    return err(UsersFeatureError.notFound(id));
  }

  const userRoles = await users.getUserRoles(id);
  const memberships = await users.getMemberships(id);

  return ok({ profile, userRoles, memberships });
}

export type GetUserResult = Awaited<ReturnType<typeof getUser>>;
