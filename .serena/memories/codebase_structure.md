# Codebase Structure

## Root Level

```
ai-trpg/
├── apps/           # Application packages
├── packages/       # Shared packages
├── docs/           # Documentation (design.md, architecture.md)
├── .claude/        # Claude Code tasks and prompts
├── package.json    # Root package (pnpm workspaces)
├── turbo.json      # Turborepo configuration
├── pnpm-workspace.yaml
└── CLAUDE.md       # Claude Code instructions
```

## Apps

### apps/api (Backend)
```
apps/api/
├── src/
│   ├── index.ts           # Entry point (Hono app)
│   ├── trpc/              # tRPC router setup
│   ├── features/          # Vertical slices by domain
│   │   └── {domain}/
│   │       ├── router.ts
│   │       ├── repository.ts
│   │       ├── mapper.ts
│   │       └── useCases/
│   └── infrastructure/
│       └── database/
│           └── schema/    # Drizzle ORM schemas
└── wrangler.toml          # Cloudflare Workers config
```

### apps/web (Frontend)
```
apps/web/
├── src/
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Root component
│   ├── style.css          # Global styles
│   ├── lib/               # Utilities
│   └── components/        # UI components by domain
└── vite.config.ts         # Vite configuration
```

## Packages

### packages/shared
```
packages/shared/
└── src/
    ├── domain/            # Domain models
    │   ├── primitives/    # Branded types (IDs)
    │   └── {entity}/      # Entity models
    ├── types/             # TypeScript types, errors
    ├── schemas/           # Zod validation schemas
    ├── constants/         # Master data
    └── lib/               # Utilities (result.ts, brand.ts)
```

### packages/typescript-config
Shared TypeScript configurations.

### packages/eslint-config
Shared ESLint configurations with Prettier integration.

## Key Files

- `docs/design.md` - Full game design specification (Japanese)
- `docs/architecture.md` - Technical architecture details
- `packages/shared/src/types/errors.ts` - Domain error types
- `packages/shared/src/lib/result.ts` - Result type utilities
- `packages/shared/src/lib/brand.ts` - Branded type utility
