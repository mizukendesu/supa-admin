import "server-only";
import { decrypt } from "@supa-admin/crypto";
import type { PlatformRole } from "@supa-admin/projections";
import {
  createDbContext,
  createUsersRepository,
  findConnectionAnonKeyEnc,
  isConnectionMember,
} from "@supa-admin/repository-kit";

export async function getAnonKey(
  connectionId: string,
  actorId: string,
  role?: PlatformRole,
): Promise<string | null> {
  const ctx = await createDbContext({ mode: "service" });

  let platformRole = role;
  if (!platformRole) {
    const users = createUsersRepository(ctx.db);
    const profile = await users.findProfileById(actorId);
    if (!profile) return null;
    platformRole = profile.role;
  }

  if (platformRole !== "platform_admin") {
    const allowed = await isConnectionMember(ctx.db, connectionId, actorId);
    if (!allowed) return null;
  }

  const anonKeyEnc = await findConnectionAnonKeyEnc(ctx.db, connectionId);
  if (!anonKeyEnc) return null;

  return decrypt(anonKeyEnc);
}
