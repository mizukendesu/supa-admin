import { and, type DbOrTx, eq, schema } from "@supa-admin/db";
import type { PlatformRole } from "@supa-admin/projections";

export type SetupRepository = ReturnType<typeof createSetupRepository>;

const SETUP_COMPLETE_KEY = "setup_complete";

function parseSetupComplete(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "string") return value === "true";
  if (value && typeof value === "object" && "status" in value) {
    return false;
  }
  return false;
}

export function createSetupRepository(db: DbOrTx) {
  return {
    async isSetupComplete(): Promise<boolean> {
      const [row] = await db
        .select()
        .from(schema.appSettings)
        .where(eq(schema.appSettings.key, SETUP_COMPLETE_KEY))
        .limit(1);
      return parseSetupComplete(row?.value);
    },

    /**
     * setup 処理の排他ロック。`setup_complete` が false のときだけ in_progress に更新する。
     */
    async tryLockSetup(): Promise<boolean> {
      const [row] = await db
        .update(schema.appSettings)
        .set({
          value: { status: "in_progress" },
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.appSettings.key, SETUP_COMPLETE_KEY),
            eq(schema.appSettings.value, false),
          ),
        )
        .returning({ key: schema.appSettings.key });
      return Boolean(row);
    },

    async completeSetup(): Promise<void> {
      await db
        .update(schema.appSettings)
        .set({
          value: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.appSettings.key, SETUP_COMPLETE_KEY));
    },

    async unlockSetup(): Promise<void> {
      await db
        .update(schema.appSettings)
        .set({
          value: false,
          updatedAt: new Date(),
        })
        .where(eq(schema.appSettings.key, SETUP_COMPLETE_KEY));
    },

    async promoteProfileToAdmin(
      userId: string,
      displayName: string,
    ): Promise<void> {
      await db
        .update(schema.profiles)
        .set({
          role: "platform_admin" satisfies PlatformRole,
          displayName,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.id, userId));
    },
  };
}
