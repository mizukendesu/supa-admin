import "server-only";
import { createClient, type Database, type DbOrTx, sql } from "@supa-admin/db";

export type DbContextMode = "service" | "member";

export type CreateDbContextOptions =
  | {
      mode: "service";
      connectionString?: string;
    }
  | {
      mode: "member";
      actorId: string;
      connectionString?: string;
    };

export type DbContext = {
  readonly db: Database;
  readonly mode: DbContextMode;
  readonly actorId?: string;
  transaction<T>(fn: (tx: DbOrTx) => Promise<T>): Promise<T>;
  run<T>(fn: (client: DbOrTx) => Promise<T>): Promise<T>;
};

function resolveConnectionString(connectionString?: string): string {
  const resolved =
    connectionString ??
    process.env.DATABASE_URL ??
    process.env.TEST_DATABASE_URL;
  if (!resolved) {
    throw new Error("DATABASE_URL is required to create a database context");
  }
  return resolved;
}

async function applyMemberContext(
  client: DbOrTx,
  actorId: string,
): Promise<void> {
  await client.execute(
    sql`SELECT set_config('request.jwt.claim.sub', ${actorId}, true)`,
  );
}

/**
 * Meta DB への Drizzle 接続コンテキストを生成する。
 * - `service`: RLS をバイパスする管理操作向け
 * - `member`: `request.jwt.claim.sub` を設定し Meta RLS を尊重
 */
export async function createDbContext(
  options: CreateDbContextOptions,
): Promise<DbContext> {
  const db = createClient(resolveConnectionString(options.connectionString));

  if (options.mode === "member") {
    await applyMemberContext(db, options.actorId);
  }

  return {
    db,
    mode: options.mode,
    actorId: options.mode === "member" ? options.actorId : undefined,
    transaction<T>(fn: (tx: DbOrTx) => Promise<T>): Promise<T> {
      return db.transaction(async (tx) => {
        if (options.mode === "member") {
          await applyMemberContext(tx, options.actorId);
        }
        return fn(tx);
      });
    },
    run<T>(fn: (client: DbOrTx) => Promise<T>): Promise<T> {
      if (options.mode === "member") {
        return db.transaction(async (tx) => {
          await applyMemberContext(tx, options.actorId);
          return fn(tx);
        });
      }
      return fn(db);
    },
  };
}
