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
│   │   ├── auth/          # Authentication
│   │   ├── character/     # Character management
│   │   ├── dungeon/       # Dungeon management
│   │   ├── directive/     # Directive master data API
│   │   └── fragment/      # Fragment master data API
│   │   (each contains: router.ts, repository.ts, mapper.ts, useCases/)
│   ├── services/          # Shared services
│   │   └── llm/           # LLM service layer
│   │       ├── providers/ # LLM providers (Groq, Gemini, OpenRouter)
│   │       ├── prompts/   # Prompt templates (biography, names)
│   │       ├── service.ts # LLM service with fallback
│   │       └── types.ts   # LLM types and interfaces
│   ├── services/          # Shared services
│   │   └── llm/           # LLM service layer
│   │       ├── providers/ # LLM providers (Groq, Gemini, OpenRouter)
│   │       ├── prompts/   # Prompt templates (biography, names)
│   │       ├── service.ts # LLM service with fallback
│   │       └── types.ts   # LLM types and interfaces
│   └── infrastructure/
│       ├── database/
│       │   └── schema/    # Drizzle ORM schemas (incl. llmUsageLogs)
│       └── rateLimit/     # LLM rate limiting (user/IP based)
└── wrangler.toml          # Cloudflare Workers config
```

### apps/web (Frontend)

```
apps/web/
├── src/
│   ├── main.tsx           # Entry point (TanStack Router setup)
│   ├── style.css          # Global styles (Tailwind)
│   ├── routeTree.gen.ts   # Auto-generated route tree
│   ├── routes/            # File-based routing (TanStack Router)
│   │   ├── __root.tsx     # Root layout
│   │   ├── index.tsx      # Home page (/)
│   │   ├── login.tsx      # Login page (/login)
│   │   ├── characters/    # Character routes
│   │   │   ├── index.tsx  # Character list (/characters)
│   │   │   └── new.tsx    # Character creation wizard (/characters/new)
│   │   └── dungeons/      # Dungeon routes
│   │       └── index.tsx  # Dungeon list (/dungeons)
│   ├── components/        # UI components
│   │   ├── layout/        # Layout components (Header, etc.)
│   │   └── character/     # Character components
│   │       ├── wizard/    # Creation wizard steps
│   │       │   ├── FragmentStep.tsx
│   │       │   ├── BiographyStep.tsx
│   │       │   ├── NameDirectivesStep.tsx
│   │       │   └── ConfirmStep.tsx
│   │       ├── CharacterDetail.tsx
│   │       ├── FragmentList.tsx
│   │       └── DirectiveList.tsx
│   ├── stores/            # Zustand stores
│   │   └── characterCreation.ts  # Character creation state
│   └── lib/               # Utilities
│       ├── trpc.ts        # tRPC client setup
│       ├── supabase.ts    # Supabase client
│       └── utils.ts       # General utilities
├── e2e/                   # E2E tests (Playwright)
└── vite.config.ts         # Vite configuration (TanStack Router plugin)
```

## Packages

### packages/shared

```
packages/shared/
└── src/
    ├── domain/            # Domain models
    │   ├── primitives/    # Branded types (IDs)
    │   └── {entity}/      # Entity models (character/, etc.)
    ├── types/             # TypeScript types, errors
    ├── schemas/           # Zod validation schemas
    ├── constants/         # Master data
    │   ├── fragments.ts   # Fragment master data (origin/loss/mark/sin/quest/trait)
    │   ├── directives.ts  # Directive master data (4 situations)
    │   └── index.ts       # Barrel export
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
