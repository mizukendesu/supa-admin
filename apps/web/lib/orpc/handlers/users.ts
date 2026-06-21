import "server-only";

import {
  createUser,
  getUser,
  listUsers,
  updateUser,
} from "@supa-admin/feature-users";
import { os, withAdmin } from "../os";
import { mapResultToOrpcError } from "./shared";

export const usersHandlers = os.users.router({
  list: os.users.list.use(withAdmin).handler(async () => {
    const users = await listUsers();
    return { users };
  }),

  create: os.users.create.use(withAdmin).handler(async ({ input }) => {
    return mapResultToOrpcError(await createUser(input));
  }),

  get: os.users.get.use(withAdmin).handler(async ({ input }) => {
    const result = mapResultToOrpcError(await getUser(input.id));
    return {
      userRoles: result.userRoles,
      memberships: result.memberships,
    };
  }),

  update: os.users.update.use(withAdmin).handler(async ({ input }) => {
    return mapResultToOrpcError(await updateUser(input));
  }),
});
