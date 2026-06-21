import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeOnboarding } from "../src/complete-onboarding";

vi.mock("@supa-admin/feature-connections", () => ({
  userCanAccessConnection: vi.fn(),
}));

vi.mock("@supa-admin/rls", () => ({
  getConnectionOnboardingStatus: vi.fn(),
}));

import { userCanAccessConnection } from "@supa-admin/feature-connections";
import { getConnectionOnboardingStatus } from "@supa-admin/rls";

const mockUserCanAccessConnection = vi.mocked(userCanAccessConnection);
const mockGetConnectionOnboardingStatus = vi.mocked(
  getConnectionOnboardingStatus,
);

describe("completeOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns onboarding status for accessible connections", async () => {
    mockUserCanAccessConnection.mockResolvedValue(true);
    mockGetConnectionOnboardingStatus.mockResolvedValue({
      steps: {
        bootstrap: true,
        schemaSynced: true,
        rolesConfigured: false,
        usersProvisioned: false,
      },
      complete: false,
    });

    const result = await completeOnboarding("conn-1", "user-1", "member");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.complete).toBe(false);
    expect(result.value.steps.rolesConfigured).toBe(false);
  });

  it("returns forbidden when user lacks access", async () => {
    mockUserCanAccessConnection.mockResolvedValue(false);

    const result = await completeOnboarding("conn-1", "user-1", "member");

    expect(result.ok).toBe(false);
    expect(mockGetConnectionOnboardingStatus).not.toHaveBeenCalled();
  });
});
