import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    include: ["scripts/__tests__/**/*.test.ts"],
  },
});
