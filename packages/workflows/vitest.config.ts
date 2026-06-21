import path from "node:path";
import { fileURLToPath } from "node:url";
import sharedConfig from "@supa-admin/vitest-config/no-setup";
import { defineConfig, mergeConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      setupFiles: ["@supa-admin/vitest-config/setup"],
    },
    resolve: {
      alias: {
        "server-only": path.resolve(
          rootDir,
          "../../tooling/vitest/server-only-mock.ts",
        ),
      },
    },
  }),
);
