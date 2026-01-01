# AI-TRPG Project Overview

## Purpose
AI-TRPG (灰暦の世界 - The World of Ashen Calendar) is an AI-generated TRPG replay game. Players create characters, form parties, select dungeons, and the AI generates narrative sessions as TRPG replay text. The game emphasizes narrative and lore over numerical stats.

**Core Concept**: "Set up a TRPG session, let AI play it out, harvest the story"

## Tech Stack

### Frontend (apps/web)
- React 19 + TypeScript + Vite
- TanStack Router (file-based routing)
- TanStack Query + tRPC client
- Tailwind CSS 4
- Zustand (state management)
- shadcn/ui components

### Backend (apps/api)
- Hono on Cloudflare Workers
- tRPC for type-safe API
- Drizzle ORM
- Supabase (PostgreSQL)

### Shared (packages/shared)
- Domain models and primitives
- Zod schemas
- neverthrow Result types

### LLM Integration
- Multi-provider: Gemini, Groq, GitHub Models
- Abstraction layer with fallback strategy

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

## Dependency Rules
- `apps/web` and `apps/api` depend on `packages/shared`
- `apps/web` and `apps/api` must NOT depend on each other
- `packages/shared` has no internal dependencies

## Package Manager
- pnpm 8.15.6
- Turborepo for monorepo orchestration
