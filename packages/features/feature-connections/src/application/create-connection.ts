import "server-only";
import { encrypt } from "@supa-admin/crypto";
import { err, ok, type Result } from "@supa-admin/ddd";
import {
  createConnectionRepository,
  createDbContext,
} from "@supa-admin/repository-kit";
import {
  executeTargetBootstrap,
  probeConnectionBootstrap,
} from "@supa-admin/rls";
import { fetchSchemaViaRest } from "@supa-admin/schema";
import { validateTargetUrl } from "@supa-admin/utils";
import { Connection } from "../domain/connection";
import { ConnectionsFeatureError } from "../errors";

function allowLocalTargetUrlsFromEnv() {
  const flag = process.env.ALLOW_LOCAL_TARGET_URLS;
  return {
    allowLocalTargetUrls: flag === "true" || flag === "1",
  };
}

export type CreateConnectionInput = {
  name: string;
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  createdBy?: string | null;
};

export type CreateConnectionResult = {
  connection: Awaited<
    ReturnType<ReturnType<typeof createConnectionRepository>["findById"]>
  >;
  tableCount: number;
  setupSql?: string;
};

export async function createConnection(
  input: CreateConnectionInput,
): Promise<
  Result<CreateConnectionResult, InstanceType<typeof ConnectionsFeatureError>>
> {
  const urlCheck = validateTargetUrl(input.url, allowLocalTargetUrlsFromEnv());
  if (!urlCheck.ok) {
    return err(
      new ConnectionsFeatureError(urlCheck.reason, {
        code: "feature-connections/invalid-url",
      }),
    );
  }

  const normalizedUrl = Connection.normalizeUrl(input.url);
  const serviceRoleEnc = encrypt(input.serviceRoleKey);
  const test = await fetchSchemaViaRest(normalizedUrl, serviceRoleEnc);

  if (test.error && test.tables.length === 0) {
    return err(new ConnectionsFeatureError(test.error));
  }

  try {
    const ctx = await createDbContext({ mode: "service" });
    const repo = createConnectionRepository(ctx.db);

    const connection = await repo.create({
      name: input.name.trim(),
      url: normalizedUrl,
      anonKeyEnc: encrypt(input.anonKey),
      serviceRoleEnc,
      createdBy: input.createdBy ?? null,
      bootstrapStatus: "pending",
    });

    if (test.tables.length > 0) {
      await repo.replaceTables(
        connection.id,
        test.tables.map((table) => ({
          tableName: table.table_name,
          columns: table.columns,
        })),
      );
      await repo.updateSchemaCachedAt(connection.id, new Date());
    }

    const probe = await probeConnectionBootstrap(
      connection.id,
      connection.url,
      connection.service_role_enc,
    );

    let resultConnection = connection;
    let setupSql: string | undefined;

    if (probe.ready) {
      const bootstrap = await executeTargetBootstrap(
        connection.id,
        connection.url,
        connection.service_role_enc,
      );
      if (bootstrap.success) {
        const updated = await repo.findById(connection.id);
        if (updated) resultConnection = updated;
      }
    } else {
      setupSql = probe.setupSql;
    }

    return ok({
      connection: resultConnection,
      tableCount: test.tables.length,
      setupSql,
    });
  } catch (error) {
    return err(
      new ConnectionsFeatureError(
        error instanceof Error ? error.message : "Failed to create connection",
      ),
    );
  }
}
