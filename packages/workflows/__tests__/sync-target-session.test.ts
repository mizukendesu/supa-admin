import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncTargetSession } from "../src/sync-target-session";

vi.mock("@supa-admin/feature-connections", () => ({
  userCanAccessConnection: vi.fn(),
}));

vi.mock("@supa-admin/rls", () => ({
  syncTargetUserPermissions: vi.fn(),
}));

vi.mock("../src/internal/connection-credentials", () => ({
  loadConnectionCredentials: vi.fn(),
}));

import { userCanAccessConnection } from "@supa-admin/feature-connections";
import { syncTargetUserPermissions } from "@supa-admin/rls";
import { loadConnectionCredentials } from "../src/internal/connection-credentials";

const mockUserCanAccessConnection = vi.mocked(userCanAccessConnection);
const mockSyncTargetUserPermissions = vi.mocked(syncTargetUserPermissions);
const mockLoadConnectionCredentials = vi.mocked(loadConnectionCredentials);

describe("syncTargetSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncs permissions when access and bootstrap are valid", async () => {
    mockUserCanAccessConnection.mockResolvedValue(true);
    mockLoadConnectionCredentials.mockResolvedValue({
      url: "http://demo",
      serviceRoleEnc: "enc-service",
      bootstrapStatus: "ready",
    });
    mockSyncTargetUserPermissions.mockResolvedValue({
      success: true,
      targetUserId: "target-1",
    });

    const result = await syncTargetSession({
      userId: "user-1",
      role: "member",
      connectionId: "conn-1",
      targetEmail: "user@example.com",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      success: true,
      targetUserId: "target-1",
    });
  });

  it("returns forbidden when user cannot access connection", async () => {
    mockUserCanAccessConnection.mockResolvedValue(false);

    const result = await syncTargetSession({
      userId: "user-1",
      role: "member",
      connectionId: "conn-1",
      targetEmail: "user@example.com",
    });

    expect(result.ok).toBe(false);
    expect(mockSyncTargetUserPermissions).not.toHaveBeenCalled();
  });
});
