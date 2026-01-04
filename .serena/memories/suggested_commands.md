# Suggested Commands

## Development

```bash
# Install dependencies
pnpm install

# Start development (web + api)
pnpm dev

# Build all packages
pnpm build
```

## Code Quality

```bash
# Lint all packages (ESLint + Prettier, with auto-fix)
pnpm lint -- --fix

# Type check all packages
pnpm typecheck

# Check code similarity/duplication
pnpm similarity
```

## Testing

```bash
# Run unit tests
pnpm test

# Test coverage (per package)
pnpm --filter @ai-trpg/shared test:coverage
pnpm --filter @ai-trpg/api test:coverage

# Mutation testing (per package)
pnpm --filter @ai-trpg/shared mutation
pnpm --filter @ai-trpg/shared mutation:file "src/lib/foo.ts"
pnpm --filter @ai-trpg/api mutation
pnpm --filter @ai-trpg/api mutation:file "src/services/foo.ts"

# E2E tests (web)
pnpm --filter @ai-trpg/web e2e          # headless
pnpm --filter @ai-trpg/web e2e:headed   # with browser
pnpm --filter @ai-trpg/web e2e:ui       # UI mode
```

## Database (Supabase + Drizzle)

```bash
# Start Supabase local
npx supabase start

# Check Supabase status
npx supabase status

# Push schema changes (Drizzle ORM) - NOT supabase db push
pnpm --filter @ai-trpg/api db:push

# Open Drizzle Studio (DB GUI)
pnpm --filter @ai-trpg/api db:studio

# Seed database
pnpm --filter @ai-trpg/api seed
```

## Cloudflare Workers (API)

```bash
# Start API dev server
pnpm --filter @ai-trpg/api dev

# Deploy API
pnpm --filter @ai-trpg/api deploy

# Generate Cloudflare types
pnpm --filter @ai-trpg/api cf-typegen
```

## Web App

```bash
# Start web dev server
pnpm --filter @ai-trpg/web dev

# Build web app
pnpm --filter @ai-trpg/web build

# Preview production build
pnpm --filter @ai-trpg/web preview
```

## Turborepo

```bash
# Run specific task across all packages
turbo run <task>

# Clean all build artifacts
pnpm clean
```
