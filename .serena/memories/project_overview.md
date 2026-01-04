# AI-TRPG Project Overview

## Purpose

AI-TRPG (灰暦の世界 - The World of Ashen Calendar) is an AI-generated TRPG replay game. Players create characters, form parties, select dungeons, and the AI generates narrative sessions as TRPG replay text. The game emphasizes narrative and lore over numerical stats.

**Core Concept**: "Set up a TRPG session, let AI play it out, harvest the story"

## Tech Stack

### Frontend (apps/web)

- React 19 + TypeScript + Vite 7
- TanStack Router (file-based routing)
- TanStack Query + tRPC client
- Tailwind CSS 4
- Zustand (state management)
- shadcn/ui components
- Playwright (E2E testing)

### Backend (apps/api)

- Hono on Cloudflare Workers
- tRPC for type-safe API
- Drizzle ORM
- Supabase (PostgreSQL)
- Vitest + Stryker (unit/mutation testing)

### Shared (packages/shared)

- Domain models and primitives
- Zod schemas
- neverthrow Result types
- Vitest + Stryker (unit/mutation testing)

### LLM Integration

- Multi-provider: Gemini, Groq, GitHub Models (OpenRouter)
- Abstraction layer with fallback strategy
- Rate limiting (user/IP based)
- Usage logging to database

## Monorepo Structure

```
ai-trpg/
├── apps/
│   ├── web/           # Frontend (React + Vite)
│   └── api/           # Backend (Hono + Cloudflare Workers)
├── packages/
│   ├── shared/        # Shared types, schemas, domain models
│   ├── typescript-config/  # Shared TS configs
│   └── eslint-config/      # Shared ESLint configs
├── docs/              # Design and architecture docs
└── .claude/           # Claude Code tasks and prompts
```

## Implemented Features

### Authentication

- Supabase Auth integration
- Protected routes with login redirect
- Session management

### Dashboard (My Page)

- User's own characters list
- Quick navigation to character creation
- Header navigation link

### Character System

- Character list (public/own views)
- Character detail page
- 4-step creation wizard: Fragment → Biography (AI) → Name/Directives → Confirm
- Fragment selection (6 categories: origin, loss, mark, sin, quest, trait)
- AI biography generation with LLM service (Groq/Gemini fallback)
- AI name suggestions
- Directive selection for 4 situations
- Character save with lending settings

### Dungeon System

- Dungeon list page
- Dungeon detail page

### Master Data APIs

- `fragment.list` - Get all fragments by category
- `directive.list` - Get all directives by situation

## Dependency Rules

- `apps/web` and `apps/api` depend on `packages/shared`
- `apps/web` may use `import type` for `AppRouter` from `apps/api` (tRPC type safety only)
- `apps/web` and `apps/api` must NOT have runtime dependencies on each other
- `packages/shared` has no internal dependencies

## Package Manager

- pnpm 10.27.0
- Node.js 24.12.0 (via Volta)
- Turborepo for monorepo orchestration
