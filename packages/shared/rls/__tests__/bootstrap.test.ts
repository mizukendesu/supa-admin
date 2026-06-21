import { mockSupabaseQuery } from "@supa-admin/vitest-config/supabase-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockFrom = vi.fn();
const mockServiceFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock("@supa-admin/auth/server", () => ({
  createMetaServerClient: vi.fn(async () => ({ from: mockFrom })),
  createMetaServiceClient: vi.fn(() => ({ from: mockServiceFrom })),
}));

vi.mock("@supa-admin/supabase-target/admin", () => ({
  createTargetAdminClient: vi.fn(() => ({ rpc: mockRpc })),
}));

function chainMock(resolved: { data: unknown; error: unknown }) {
  return mockSupabaseQuery(resolved);
}

describe("probeTargetBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when exec_sql succeeds, then reports available", async () => {
    mockRpc.mockResolvedValue({ error: null });
    const { probeTargetBootstrap } = await import("../src/index.js");
    const result = await probeTargetBootstrap({ rpc: mockRpc });
    expect(result).toEqual({ execSqlAvailable: true });
  });

  it("when exec_sql missing, then reports unavailable without error", async () => {
    mockRpc.mockResolvedValue({
      error: { message: "Could not find the function public.exec_sql(query)" },
    });
    const { probeTargetBootstrap } = await import("../src/index.js");
    const result = await probeTargetBootstrap({ rpc: mockRpc });
    expect(result).toEqual({ execSqlAvailable: false });
  });

  it("when rpc fails with other error, then returns error message", async () => {
    mockRpc.mockResolvedValue({ error: { message: "permission denied" } });
    const { probeTargetBootstrap } = await import("../src/index.js");
    const result = await probeTargetBootstrap({ rpc: mockRpc });
    expect(result).toEqual({
      execSqlAvailable: false,
      error: "permission denied",
    });
  });
});

describe("getConnectionTableNames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when tables exist, then returns sorted names", async () => {
    mockFrom.mockReturnValue(
      chainMock({
        data: [{ table_name: "comments" }, { table_name: "posts" }],
        error: null,
      }),
    );
    const { getConnectionTableNames } = await import("../src/index.js");
    const names = await getConnectionTableNames("conn-1");
    expect(names).toEqual(["comments", "posts"]);
  });
});

describe("probeConnectionBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when exec_sql available, then returns ready", async () => {
    mockFrom.mockReturnValue(
      chainMock({ data: [{ table_name: "posts" }], error: null }),
    );
    mockRpc.mockResolvedValue({ error: null });

    const { probeConnectionBootstrap } = await import("../src/index.js");
    const result = await probeConnectionBootstrap(
      "conn-1",
      "https://example.supabase.co",
      "enc",
    );
    expect(result).toEqual({ ready: true });
  });

  it("when exec_sql missing, then returns setup SQL", async () => {
    mockFrom.mockReturnValue(
      chainMock({ data: [{ table_name: "posts" }], error: null }),
    );
    mockRpc.mockResolvedValue({
      error: { message: "Could not find the function public.exec_sql(query)" },
    });

    const { probeConnectionBootstrap } = await import("../src/index.js");
    const result = await probeConnectionBootstrap(
      "conn-1",
      "https://example.supabase.co",
      "enc",
    );
    expect(result.ready).toBe(false);
    if (!result.ready) {
      expect(result.setupSql).toContain("exec_sql");
      expect(result.setupSql).toContain('"posts"');
    }
  });
});

describe("executeTargetBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when exec_sql missing, then returns error", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    mockRpc.mockResolvedValue({
      error: { message: "Could not find the function public.exec_sql(query)" },
    });

    const { executeTargetBootstrap } = await import("../src/index.js");
    const result = await executeTargetBootstrap(
      "conn-1",
      "https://example.supabase.co",
      "enc",
    );
    expect(result).toEqual({
      success: false,
      error: "exec_sql is not available on the Target project",
    });
  });

  it("when rpc apply fails, then returns error", async () => {
    mockFrom.mockReturnValue(
      chainMock({ data: [{ table_name: "posts" }], error: null }),
    );
    mockRpc
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "syntax error" } });

    const { executeTargetBootstrap } = await import("../src/index.js");
    const result = await executeTargetBootstrap(
      "conn-1",
      "https://example.supabase.co",
      "enc",
    );
    expect(result).toEqual({ success: false, error: "syntax error" });
  });

  it("when apply succeeds, then marks connection ready", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connection_tables") {
        return chainMock({ data: [{ table_name: "posts" }], error: null });
      }
      if (table === "connections") {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return chainMock({ data: null, error: null });
    });
    mockRpc.mockResolvedValue({ error: null });

    const { executeTargetBootstrap } = await import("../src/index.js");
    const result = await executeTargetBootstrap(
      "conn-1",
      "https://example.supabase.co",
      "enc",
    );
    expect(result).toEqual({ success: true });
  });
});

describe("verifyConnectionBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when exec_sql missing, then returns setup SQL", async () => {
    mockFrom.mockReturnValue(
      chainMock({ data: [{ table_name: "posts" }], error: null }),
    );
    mockRpc.mockResolvedValue({
      error: { message: "Could not find the function public.exec_sql(query)" },
    });

    const { verifyConnectionBootstrap } = await import("../src/index.js");
    const result = await verifyConnectionBootstrap(
      "conn-1",
      "https://example.supabase.co",
      "enc",
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.setupSql).toContain("exec_sql");
    }
  });

  it("when exec_sql available and apply succeeds, then returns ready", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connection_tables") {
        return chainMock({ data: [{ table_name: "posts" }], error: null });
      }
      if (table === "connections") {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return chainMock({ data: null, error: null });
    });
    mockRpc.mockResolvedValue({ error: null });

    const { verifyConnectionBootstrap } = await import("../src/index.js");
    const result = await verifyConnectionBootstrap(
      "conn-1",
      "https://example.supabase.co",
      "enc",
    );
    expect(result).toEqual({ success: true, status: "ready" });
  });
});

describe("assertConnectionBootstrapReady", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("when status is ready, then resolves", async () => {
    mockServiceFrom.mockReturnValue(
      chainMock({ data: { bootstrap_status: "ready" }, error: null }),
    );
    const { assertConnectionBootstrapReady } = await import("../src/index.js");
    await expect(
      assertConnectionBootstrapReady("conn-1"),
    ).resolves.toBeUndefined();
  });

  it("when status is pending, then throws", async () => {
    mockServiceFrom.mockReturnValue(
      chainMock({ data: { bootstrap_status: "pending" }, error: null }),
    );
    const { assertConnectionBootstrapReady } = await import("../src/index.js");
    await expect(assertConnectionBootstrapReady("conn-1")).rejects.toThrow(
      "Target bootstrap is not complete",
    );
  });

  it("when connection missing, then throws", async () => {
    mockServiceFrom.mockReturnValue(
      chainMock({ data: null, error: { message: "not found" } }),
    );
    const { assertConnectionBootstrapReady } = await import("../src/index.js");
    await expect(assertConnectionBootstrapReady("conn-1")).rejects.toThrow(
      "Connection not found",
    );
  });
});
