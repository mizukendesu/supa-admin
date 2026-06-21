import { ok } from "@supa-admin/ddd";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { provisionTargetUserWorkflow } from "../src/provision-target-user";

vi.mock("@supa-admin/feature-users", () => ({
  provisionTargetUser: vi.fn(),
}));

import { provisionTargetUser } from "@supa-admin/feature-users";

const mockProvisionTargetUser = vi.mocked(provisionTargetUser);

describe("provisionTargetUserWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to feature-users provisionTargetUser", async () => {
    mockProvisionTargetUser.mockResolvedValue(
      ok({ success: true, targetUserId: "target-1" }),
    );

    const input = {
      userId: "user-1",
      connectionId: "conn-1",
      email: "user@example.com",
      password: "secret",
    };

    const result = await provisionTargetUserWorkflow(input);

    expect(mockProvisionTargetUser).toHaveBeenCalledWith(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.targetUserId).toBe("target-1");
  });
});
