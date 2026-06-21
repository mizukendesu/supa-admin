import "server-only";

import { ORPCError } from "@orpc/server";
import {
  bootstrapApply,
  bootstrapProbe,
  bootstrapVerify,
  deleteConnection,
  getAccessibleConnection,
  getAnonKey,
  getConnection,
  listAccessibleConnections,
  listConnections,
  revealWebhookSecret,
  rotateWebhookSecret,
} from "@supa-admin/feature-connections";
import {
  completeOnboarding,
  createConnectionWorkflow,
  syncConnectionSchemaWorkflow,
  syncTargetSession,
} from "@supa-admin/workflows";
import { os, withAdmin, withAuth } from "../os";
import {
  mapResultToOrpcError,
  mapThrownToOrpcError,
  pickConnectionSummary,
} from "./shared";

export const connectionsHandlers = os.connections.router({
  list: os.connections.list.use(withAdmin).handler(async () => {
    const connections = await listConnections();
    return { connections };
  }),

  create: os.connections.create
    .use(withAdmin)
    .handler(async ({ input, context }) => {
      const result = await createConnectionWorkflow({
        ...input,
        createdBy: context.profile.id,
      });
      const value = mapResultToOrpcError(result);
      if (!value.connection) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Connection missing after create",
        });
      }
      return {
        connection: pickConnectionSummary(value.connection),
        tableCount: value.tableCount,
        setupSql: value.setupSql,
      };
    }),

  get: os.connections.get.use(withAdmin).handler(async ({ input }) => {
    const result = mapResultToOrpcError(await getConnection(input.id));
    return {
      connection: pickConnectionSummary(result.connection),
      tables: result.tables,
    };
  }),

  delete: os.connections.delete.use(withAdmin).handler(async ({ input }) => {
    return mapResultToOrpcError(await deleteConnection(input.id));
  }),

  listAccessible: os.connections.listAccessible
    .use(withAuth)
    .handler(async ({ context }) => {
      const connections = await listAccessibleConnections(
        context.profile.id,
        context.profile.role,
      );
      return { connections };
    }),

  getAccessible: os.connections.getAccessible
    .use(withAuth)
    .handler(async ({ input, context }) => {
      const result = await getAccessibleConnection(
        input.id,
        context.profile.id,
        context.profile.role,
      );
      return mapResultToOrpcError(result);
    }),

  getAnonKey: os.connections.getAnonKey
    .use(withAuth)
    .handler(async ({ input, context }) => {
      const anonKey = await getAnonKey(
        input.id,
        context.profile.id,
        context.profile.role,
      );
      if (!anonKey) {
        throw new ORPCError("FORBIDDEN", { message: "Forbidden" });
      }
      return { anonKey };
    }),

  schemaSync: os.connections.schemaSync
    .use(withAdmin)
    .handler(async ({ input }) => {
      return mapResultToOrpcError(await syncConnectionSchemaWorkflow(input.id));
    }),

  rotateWebhookSecret: os.connections.rotateWebhookSecret
    .use(withAdmin)
    .handler(async ({ input }) => {
      return mapResultToOrpcError(await rotateWebhookSecret(input.id));
    }),

  revealWebhookSecret: os.connections.revealWebhookSecret
    .use(withAdmin)
    .handler(async ({ input }) => {
      return mapResultToOrpcError(await revealWebhookSecret(input.id));
    }),

  bootstrap: os.connections.bootstrap.router({
    probe: os.connections.bootstrap.probe
      .use(withAdmin)
      .handler(async ({ input }) => {
        try {
          return await bootstrapProbe(input.id);
        } catch (error) {
          mapThrownToOrpcError(error);
        }
      }),

    apply: os.connections.bootstrap.apply
      .use(withAdmin)
      .handler(async ({ input }) => {
        try {
          return await bootstrapApply(input.id);
        } catch (error) {
          mapThrownToOrpcError(error);
        }
      }),

    verify: os.connections.bootstrap.verify
      .use(withAdmin)
      .handler(async ({ input }) => {
        try {
          return await bootstrapVerify(input.id);
        } catch (error) {
          mapThrownToOrpcError(error);
        }
      }),
  }),

  onboarding: os.connections.onboarding.router({
    status: os.connections.onboarding.status
      .use(withAuth)
      .handler(async ({ input, context }) => {
        const result = await completeOnboarding(
          input.id,
          context.profile.id,
          context.profile.role,
        );
        return mapResultToOrpcError(result);
      }),
  }),

  target: os.connections.target.router({
    syncPermissions: os.connections.target.syncPermissions
      .use(withAuth)
      .handler(async ({ input, context }) => {
        const result = await syncTargetSession({
          userId: context.profile.id,
          role: context.profile.role,
          connectionId: input.connectionId,
          targetEmail: input.targetEmail,
        });
        const value = mapResultToOrpcError(result);
        if (!value.success) {
          throw new ORPCError("PRECONDITION_FAILED", {
            message: value.message,
          });
        }
        return {
          success: true as const,
          targetUserId: value.targetUserId,
        };
      }),
  }),
});
