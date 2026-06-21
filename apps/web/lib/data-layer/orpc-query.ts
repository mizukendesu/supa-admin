import type { ContractRouterClient } from "@orpc/contract";
import type { Contract } from "@supa-admin/orpc-contract";
import {
  QueryClient,
  type QueryFunctionContext,
  type QueryKey,
} from "@tanstack/react-query";

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
      },
    },
  });
}

export const orpcQueryKeys = {
  root: ["orpc"] as const,
  setup: {
    isComplete: () => [...orpcQueryKeys.root, "setup", "isComplete"] as const,
  },
  connections: {
    all: () => [...orpcQueryKeys.root, "connections"] as const,
    list: () => [...orpcQueryKeys.connections.all(), "list"] as const,
    detail: (id: string) =>
      [...orpcQueryKeys.connections.all(), "detail", id] as const,
    accessible: () =>
      [...orpcQueryKeys.connections.all(), "accessible"] as const,
  },
  roles: {
    all: () => [...orpcQueryKeys.root, "roles"] as const,
    list: () => [...orpcQueryKeys.roles.all(), "list"] as const,
    permissions: (roleId: string, connectionId: string) =>
      [
        ...orpcQueryKeys.roles.all(),
        "permissions",
        roleId,
        connectionId,
      ] as const,
  },
  users: {
    all: () => [...orpcQueryKeys.root, "users"] as const,
    list: () => [...orpcQueryKeys.users.all(), "list"] as const,
    detail: (id: string) =>
      [...orpcQueryKeys.users.all(), "detail", id] as const,
  },
  access: {
    all: () => [...orpcQueryKeys.root, "access"] as const,
    userOverrides: (userId: string, connectionId: string) =>
      [
        ...orpcQueryKeys.access.all(),
        "userOverrides",
        userId,
        connectionId,
      ] as const,
  },
  app: {
    shell: () => [...orpcQueryKeys.root, "app", "shell"] as const,
  },
  dashboard: {
    stats: () => [...orpcQueryKeys.root, "dashboard", "stats"] as const,
  },
} as const;

type OrpcClient = ContractRouterClient<Contract>;

export function createOrpcQueryOptions(client: OrpcClient) {
  return {
    setup: {
      isComplete: {
        queryKey: orpcQueryKeys.setup.isComplete(),
        queryFn: () => client.setup.isComplete(),
      },
    },
    connections: {
      list: {
        queryKey: orpcQueryKeys.connections.list(),
        queryFn: () => client.connections.list(),
      },
      detail: (id: string) => ({
        queryKey: orpcQueryKeys.connections.detail(id),
        queryFn: () => client.connections.get({ id }),
      }),
      accessible: {
        queryKey: orpcQueryKeys.connections.accessible(),
        queryFn: () => client.connections.listAccessible(),
      },
    },
    roles: {
      list: {
        queryKey: orpcQueryKeys.roles.list(),
        queryFn: () => client.roles.list(),
      },
      permissions: (roleId: string, connectionId: string) => ({
        queryKey: orpcQueryKeys.roles.permissions(roleId, connectionId),
        queryFn: () => client.roles.getPermissions({ roleId, connectionId }),
      }),
    },
    users: {
      list: {
        queryKey: orpcQueryKeys.users.list(),
        queryFn: () => client.users.list(),
      },
      detail: (id: string) => ({
        queryKey: orpcQueryKeys.users.detail(id),
        queryFn: () => client.users.get({ id }),
      }),
    },
    access: {
      userOverrides: (userId: string, connectionId: string) => ({
        queryKey: orpcQueryKeys.access.userOverrides(userId, connectionId),
        queryFn: () => client.access.getUserOverrides({ userId, connectionId }),
      }),
    },
    app: {
      shell: {
        queryKey: orpcQueryKeys.app.shell(),
        queryFn: () => client.app.shell(),
      },
    },
    dashboard: {
      stats: {
        queryKey: orpcQueryKeys.dashboard.stats(),
        queryFn: () => client.dashboard.stats(),
      },
    },
  };
}

export type OrpcQueryOptions = ReturnType<typeof createOrpcQueryOptions>;

export async function invalidateOrpcQueries(
  queryClient: QueryClient,
  predicate: (queryKey: QueryKey) => boolean,
) {
  await queryClient.invalidateQueries({
    predicate: (query) => predicate(query.queryKey),
  });
}

export function createOrpcQueryFn<TData>(
  queryFn: (context: QueryFunctionContext) => Promise<TData>,
) {
  return queryFn;
}
