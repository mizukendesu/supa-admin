import "server-only";
import { createMetaServiceClient } from "@supa-admin/auth/server";
import { err, ok } from "@supa-admin/ddd";
import type { PlatformRole } from "@supa-admin/projections";
import {
  createDbContext,
  createUsersRepository,
} from "@supa-admin/repository-kit";
import { PlatformUser } from "../domain/platform-user";
import { UsersFeatureError } from "../errors";

export type CreateUserInput = {
  email: string;
  password: string;
  displayName?: string | null;
  role?: PlatformRole;
};

export async function createUser(input: CreateUserInput) {
  try {
    const email = PlatformUser.validateEmail(input.email);
    const service = createMetaServiceClient();
    const role = input.role ?? "member";

    const { data, error } = await service.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { display_name: input.displayName },
    });

    if (error) {
      return err(new UsersFeatureError(error.message));
    }

    const ctx = await createDbContext({ mode: "service" });
    const users = createUsersRepository(ctx.db);
    await users.updateProfile(data.user.id, {
      role,
      displayName: input.displayName ?? null,
    });

    return ok({ user: { id: data.user.id, email } });
  } catch (error) {
    return err(
      error instanceof UsersFeatureError
        ? error
        : new UsersFeatureError(
            error instanceof Error ? error.message : "Failed to create user",
          ),
    );
  }
}

export type CreateUserResult = Awaited<ReturnType<typeof createUser>>;
