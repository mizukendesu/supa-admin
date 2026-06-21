import "server-only";
import { err, ok } from "@supa-admin/ddd";
import {
  createDbContext,
  createSetupRepository,
} from "@supa-admin/repository-kit";
import { SetupFeatureError } from "../errors";
import { createMetaServiceClient } from "../infrastructure/meta-service";

export type CreateAdminInput = {
  email: string;
  password: string;
  displayName: string;
};

export async function createAdmin(input: CreateAdminInput) {
  const ctx = await createDbContext({ mode: "service" });
  const setup = createSetupRepository(ctx.db);

  const locked = await setup.tryLockSetup();
  if (!locked) {
    return err(
      new SetupFeatureError("Setup already complete", {
        code: "feature-setup/already-complete",
      }),
    );
  }

  const service = createMetaServiceClient();

  try {
    const { data: userData, error: userError } =
      await service.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        app_metadata: { role: "platform_admin" },
        user_metadata: { display_name: input.displayName },
      });

    if (userError) {
      throw new SetupFeatureError(userError.message);
    }

    await setup.promoteProfileToAdmin(userData.user.id, input.displayName);
    await setup.completeSetup();

    return ok({ success: true as const });
  } catch (error) {
    await setup.unlockSetup();
    return err(
      error instanceof SetupFeatureError
        ? error
        : new SetupFeatureError(
            error instanceof Error ? error.message : "Setup failed",
          ),
    );
  }
}

export type CreateAdminResult = Awaited<ReturnType<typeof createAdmin>>;
