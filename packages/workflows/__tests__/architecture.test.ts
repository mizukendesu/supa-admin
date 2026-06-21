import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflowSrc = join(import.meta.dirname, "../src");

describe("workflow architecture", () => {
  it("workflow entry files do not import sibling workflow entries", () => {
    const entries = readdirSync(workflowSrc).filter(
      (name) => name.endsWith(".ts") && name !== "index.ts",
    );

    for (const entry of entries) {
      const content = readFileSync(join(workflowSrc, entry), "utf8");
      for (const other of entries) {
        if (other === entry) continue;
        const importPattern = new RegExp(
          `from\\s+["']\\.\\/${other.replace(".ts", "")}["']`,
        );
        expect(content).not.toMatch(importPattern);
      }
    }
  });
});
