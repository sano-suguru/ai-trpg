# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow Rules

### CLI First Approach
- Always use CLI commands when available instead of manually writing config files
- Use `pnpm init`, `pnpm create`, `pnpm add`, etc. instead of hand-writing package.json
- Check `--help` for CLI options before attempting workarounds or manual creation

### Documentation First
- Always check Context7 for up-to-date documentation before using tools or libraries
- Never rely on assumptions or outdated knowledge - verify with official docs
- Use official templates and examples when available

### Code Quality First
- Run `pnpm lint` and `pnpm typecheck` after making changes
- Fix ALL errors AND warnings before considering a task complete
- Treat warnings as errors - do not ignore or defer them

## Project Overview

AI-TRPG (灰暦の世界 - The World of Ashen Calendar) is an AI-generated TRPG replay game. Players create characters, form parties, select dungeons, and the AI generates narrative sessions as TRPG replay text. The game emphasizes narrative and lore over numerical stats.

**Core Concept**: "Set up a TRPG session, let AI play it out, harvest the story"

## Tech Stack

- **Frontend**: React + TypeScript + Vite, Zustand (state), Tailwind CSS, shadcn/ui
- **Backend**: Hono on Cloudflare Workers
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **API**: tRPC (type-safe, shared schemas)
- **LLM**: Multi-provider (Gemini, Groq, GitHub Models) with abstraction layer
- **Error Handling**: neverthrow (Result types)

## Monorepo Structure

```
apps/
├── web/      # Frontend (React + Vite + Tailwind + shadcn/ui)
└── api/      # Backend (Hono + Cloudflare Workers)
packages/
├── shared/           # Shared types, schemas, utilities
├── typescript-config/  # Shared TypeScript configs
└── eslint-config/      # Shared ESLint configs
```

**Dependency Rules**:
- `apps/web` and `apps/api` depend on `packages/shared`
- `apps/web` and `apps/api` must NOT depend on each other
- `packages/shared` has no internal dependencies

## Common Commands

```bash
# Install dependencies
pnpm install

# Start development (web + api)
pnpm dev

# Start Supabase local
supabase start

# Run database migrations
supabase db push

# Build all packages
pnpm build

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Architecture Decisions

### Data Model
- Normalized tables for users, characters, dungeons, sessions
- JSONB for flexible nested data (fragments, directives, dungeon layers, session history)
- Row-Level Security (RLS) required on all tables
- Soft delete not used - physical delete with CASCADE

### API Design
- tRPC for type-safe client-server communication
- `publicProcedure` for unauthenticated endpoints
- `protectedProcedure` for authenticated endpoints
- SSE for real-time session generation progress

### LLM Integration
- Multi-provider abstraction with fallback strategy
- Gemini: plot structure generation
- Groq: scene text generation (fast)
- Templates in `api/services/llm/prompts/`

### Error Handling
- Use `Result<T, E>` and `ResultAsync<T, E>` from neverthrow - **NEVER use try-catch for control flow**
- Service layer returns Result types
- API handlers convert to HTTP responses using `toErrorResponse()`
- Domain errors defined in `shared/types/errors.ts`
- Use `Errors.*` factory functions to create errors (e.g., `Errors.notFound('User', id)`)
- Wrap external promises with `wrapPromise()`, `wrapDbOperation()`, or `wrapExternalCall()`
- Use `fromNullable()` to convert nullable values to Result
- Use `tryCatch()` only at boundaries with external libraries that throw

## Code Conventions

### Naming
| Target | Convention | Example |
|--------|------------|---------|
| Directories | `kebab-case` | `character-sheet/` |
| TS files | `camelCase.ts` | `characterStore.ts` |
| React components | `PascalCase.tsx` | `CharacterCard.tsx` |
| Types/Interfaces | `PascalCase` | `Character` |
| Functions/Variables | `camelCase` | `createCharacter()` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_PARTY_SIZE` |

### File Placement
| Type | Location |
|------|----------|
| Domain types | `shared/types/` |
| Zod schemas | `shared/schemas/` |
| Master data | `shared/constants/` |
| UI components | `web/components/{domain}/` |
| Business logic | `api/services/{domain}/` |

### Prohibited
- Circular dependencies
- Deep relative paths (`../../../`) - use `@/` alias
- `any` type - use `unknown` with type guards
- `console.log` in production code
- `try-catch` for control flow - use Result types instead
- `throw` statements - return `err()` instead
- Ignoring lint warnings - always fix them
- Dead code for "backward compatibility" - delete unused code immediately

## Game Domain Concepts

### Character System
- Characters defined by "fragments" (断片) not stats: origin, loss, mark, sin, quest, trait
- "Directives" (行動指針) determine behavior in situations: danger, ally_in_peril, moral_choice, unknown
- Lending settings: `all` (full access), `safe` (no death), `private` (no borrowing)

### Dungeon System
- Dungeons have layers with atmosphere, events, and a "core" (climax)
- "Resonance" (共鳴) triggers special events when character fragments match dungeon themes
- Trial types: combat, exploration, puzzle, moral_choice, inner_confrontation, survival, negotiation

### Session Generation Pipeline
1. Resonance scan (local) - match character fragments to dungeon triggers
2. Plot generation (LLM) - create story structure in YAML
3. Scene generation (LLM) - write 400-600 char scenes
4. Combine and save - store replay to DB
5. Update history - update character relationships/wounds

## Key Files

- [docs/design.md](docs/design.md) - Full game design specification (Japanese)
- [docs/architecture.md](docs/architecture.md) - Technical architecture details
- [packages/shared/src/types/errors.ts](packages/shared/src/types/errors.ts) - Domain error types and `Errors` factory
- [packages/shared/src/lib/result.ts](packages/shared/src/lib/result.ts) - Result type utilities
