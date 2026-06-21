/**
 * @vitest-environment jsdom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

const mockSchemaSync = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock("@/lib/orpc/client.browser", () => ({
  orpcBrowser: {
    connections: {
      schemaSync: (...args: unknown[]) => mockSchemaSync(...args),
      delete: vi.fn(),
      revealWebhookSecret: vi.fn(),
      rotateWebhookSecret: vi.fn(),
    },
    connectionsRls: {
      preview: vi.fn(),
      apply: vi.fn(),
    },
  },
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("./target-setup-dialog", () => ({
  TargetSetupDialog: () => null,
}));

const messages = {
  common: {
    search: "Search",
    actions: "Actions",
    delete: "Delete",
    cancel: "Cancel",
    confirm: "Confirm",
    success: "Success",
    error: "Error",
  },
  table: { rows: "rows" },
  connections: {
    name: "Name",
    url: "URL",
    status: "Status",
    lastSynced: "Last synced",
    syncSchema: "Sync schema",
    syncRls: "Sync RLS",
    schemaSynced: "Synced {count} tables",
    deleteConfirm: "Delete?",
    bootstrap: {
      setupRequired: "Setup required",
      ready: "Ready",
      setup: "Setup",
    },
    webhookSecret: {
      reveal: "Reveal secret",
      rotate: "Rotate",
      rotateConfirm: "Rotate?",
      rotateWarning: "Old secret invalid",
      title: "Webhook secret",
      oneTimeHint: "Copy now",
    },
  },
  rls: {
    preview: "Preview",
    warning: "Warning",
    apply: "Apply",
    copySql: "Copy",
  },
};

const initialConnections = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Local Target",
    url: "https://example.supabase.co",
    schema_cached_at: null,
    bootstrap_status: "ready" as const,
  },
];

function renderList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return { queryClient };
}

describe("ConnectionList", () => {
  it("when schema sync succeeds, then invalidates connections queries", async () => {
    mockSchemaSync.mockResolvedValue({ tableCount: 2, success: true });
    mockInvalidateQueries.mockResolvedValue(undefined);

    const { ConnectionList } = await import("../connection-list.js");
    const { queryClient } = renderList();
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={messages}>
          <ConnectionList connections={initialConnections} />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Sync schema" }));

    await waitFor(() => {
      expect(mockSchemaSync).toHaveBeenCalledWith({
        id: initialConnections[0]!.id,
      });
      expect(mockInvalidateQueries).toHaveBeenCalled();
    });
  });
});
