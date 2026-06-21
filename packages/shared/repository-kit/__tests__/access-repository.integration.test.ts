import { randomUUID } from "node:crypto";
import { withRollbackTx } from "@supa-admin/vitest-config/setup";
import { describe, expect, it, vi } from "vitest";
import { createAccessRepository } from "../src/access/repository";

vi.mock("server-only", () => ({}));

describe("createAccessRepository (integration)", () => {
  it("when createRole called inside withRollbackTx, then role is readable in same tx", async () => {
    const roleName = `integration-${randomUUID()}`;

    await withRollbackTx(async (tx) => {
      const access = createAccessRepository(tx);
      const created = await access.createRole(roleName, "integration test");
      const roles = await access.listRoles();
      expect(roles.some((role) => role.id === created.id)).toBe(true);
      expect(roles.find((role) => role.id === created.id)?.name).toBe(roleName);
    });
  });
});
