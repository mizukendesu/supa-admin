import "server-only";
import { and, eq, schema } from "@supa-admin/db";
import { err, ok } from "@supa-admin/ddd";
import {
  createConnectionRepository,
  createDbContext,
  createUsersRepository,
} from "@supa-admin/repository-kit";
import { buildTargetJwtPermissions } from "@supa-admin/rls";
import { createTargetAdminClient } from "@supa-admin/supabase-target/admin";
import { UsersFeatureError } from "../errors";

export type ProvisionTargetUserInput = {
  userId: string;
  connectionId: string;
  email: string;
  password: string;
};

export async function provisionTargetUser(input: ProvisionTargetUserInput) {
  const ctx = await createDbContext({ mode: "service" });
  const connections = createConnectionRepository(ctx.db);
  const users = createUsersRepository(ctx.db);

  const connection = await connections.findById(input.connectionId);
  if (!connection) {
    return err(UsersFeatureError.notFound(input.connectionId));
  }

  if (connection.bootstrap_status !== "ready") {
    return err(
      new UsersFeatureError("Target bootstrap is not complete", {
        code: "feature-users/precondition-failed",
      }),
    );
  }

  const profile = await users.findProfileById(input.userId);
  const appMeta = await buildTargetJwtPermissions(
    input.userId,
    input.connectionId,
    profile?.role ?? "member",
  );

  const targetAdmin = createTargetAdminClient(
    connection.url,
    connection.service_role_enc,
  );

  const { data: targetUser, error: createError } =
    await targetAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      app_metadata: appMeta,
    });

  if (createError) {
    return err(new UsersFeatureError(createError.message));
  }

  await ctx.db
    .delete(schema.targetUserMappings)
    .where(
      and(
        eq(schema.targetUserMappings.userId, input.userId),
        eq(schema.targetUserMappings.connectionId, input.connectionId),
      ),
    );

  await ctx.db.insert(schema.targetUserMappings).values({
    userId: input.userId,
    connectionId: input.connectionId,
    targetUserId: targetUser.user.id,
    targetEmail: input.email,
  });

  return ok({ success: true as const, targetUserId: targetUser.user.id });
}

export type ProvisionTargetUserResult = Awaited<
  ReturnType<typeof provisionTargetUser>
>;
