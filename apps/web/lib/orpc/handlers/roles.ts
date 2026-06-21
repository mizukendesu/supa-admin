import "server-only";

import {
  createRole,
  getRolePermissions,
  listRoles,
} from "@supa-admin/feature-access";
import { updateRolePermissionsWorkflow } from "@supa-admin/workflows";
import { os, withAdmin } from "../os";
import { mapResultToOrpcError } from "./shared";

export const rolesHandlers = os.roles.router({
  list: os.roles.list.use(withAdmin).handler(async () => {
    const roles = await listRoles();
    return { roles };
  }),

  create: os.roles.create.use(withAdmin).handler(async ({ input }) => {
    return {
      role: mapResultToOrpcError(
        await createRole(input.name, input.description),
      ),
    };
  }),

  getPermissions: os.roles.getPermissions
    .use(withAdmin)
    .handler(async ({ input }) => {
      const permissions = await getRolePermissions(
        input.roleId,
        input.connectionId,
      );
      return { permissions };
    }),

  updatePermissions: os.roles.updatePermissions
    .use(withAdmin)
    .handler(async ({ input, context }) => {
      return mapResultToOrpcError(
        await updateRolePermissionsWorkflow({
          roleId: input.roleId,
          connectionId: input.connectionId,
          permissions: input.permissions,
          executedBy: context.profile.id,
        }),
      );
    }),
});
