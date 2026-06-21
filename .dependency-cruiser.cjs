/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "R1-presentation-to-infrastructure",
      comment:
        "R1: presentation (apps/web) must not import infrastructure packages (repository-kit, rls, crypto, schema).",
      severity: "error",
      from: { path: "^apps/web" },
      to: {
        path: [
          "^packages/shared/repository-kit",
          "^packages/shared/rls",
          "^packages/shared/crypto",
          "^packages/shared/schema",
          "@supa-admin/repository-kit",
          "@supa-admin/rls",
          "@supa-admin/crypto",
          "@supa-admin/schema",
        ],
      },
    },
    {
      name: "R2-no-deep-feature-imports",
      comment:
        "R2: presentation must import feature packages via package root only (no domain/application/infrastructure deep paths).",
      severity: "error",
      from: { path: "^apps/web" },
      to: {
        path: [
          "^packages/features/[^/]+/src/(domain|application|infrastructure)/",
          "^packages/features/[^/]+/(domain|application|infrastructure)/",
          "@supa-admin/feature-[^/]+/.+",
        ],
      },
    },
    {
      name: "R3-components-no-workflows-or-features",
      comment:
        "R3: Client components must not import workflows or feature packages (use oRPC + projections).",
      severity: "error",
      from: { path: "^apps/web/components" },
      to: {
        path: [
          "^packages/workflows",
          "@supa-admin/workflows",
          "^packages/features",
          "@supa-admin/feature-",
        ],
      },
    },
    {
      name: "R4-no-cross-feature-imports",
      comment: "R4: feature packages must not import other feature packages.",
      severity: "error",
      from: { path: "^packages/features/([^/]+)/" },
      to: {
        path: "^packages/features/",
        pathNot: "^packages/features/$1/",
      },
    },
    {
      name: "R4-no-cross-feature-scope-imports",
      comment:
        "R4: feature packages must not import other feature packages via npm scope.",
      severity: "error",
      from: { path: "^packages/features/([^/]+)/" },
      to: {
        path: "@supa-admin/feature-",
        pathNot: "@supa-admin/feature-$1$",
      },
    },
    {
      name: "R5-no-cross-workflow-imports",
      comment:
        "R5: workflow entry files must not cross-import other workflows (shared code lives under internal/).",
      severity: "error",
      from: {
        path: "^packages/workflows/src/(?!internal/)(?!index\\.ts$)[^/]+\\.tsx?$",
      },
      to: {
        path: "^packages/workflows/src/(?!internal/)(?!index\\.ts$)[^/]+\\.tsx?$",
      },
    },
    {
      name: "R6-domain-no-infrastructure",
      comment:
        "R6: domain layer must not import infrastructure, Drizzle, or Supabase client libraries.",
      severity: "error",
      from: {
        path: "^packages/features/[^/]+/(?:src/)?domain/",
      },
      to: {
        path: [
          "^packages/shared/repository-kit",
          "^packages/shared/rls",
          "^packages/shared/crypto",
          "^packages/shared/schema",
          "^packages/shared/db",
          "@supa-admin/repository-kit",
          "@supa-admin/rls",
          "@supa-admin/crypto",
          "@supa-admin/schema",
          "@supa-admin/db",
          "drizzle-orm",
          "@supabase/supabase-js",
          "@supabase/ssr",
        ],
      },
    },
    {
      name: "R7-shared-no-upper-layers",
      comment:
        "R7: shared packages must not import presentation, workflows, or features (auth re-exports feature-access/setup).",
      severity: "error",
      from: {
        path: "^packages/shared",
        pathNot: "^packages/shared/auth",
      },
      to: {
        path: [
          "^apps/web",
          "^packages/workflows",
          "^packages/features",
          "@supa-admin/workflows",
          "@supa-admin/feature-",
        ],
      },
    },
    /*
     * R8: apps/web/app/** must not bypass lib/orpc/handlers for server-side Meta DB access.
     * Enforced by architecture-check (A1), not dependency-cruiser — grep catches Supabase .from() usage.
     */
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    exclude: {
      path: "(^|/)(__tests__|coverage|\\.next|dist)(/|$)",
    },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};
