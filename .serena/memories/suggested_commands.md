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
# Lint all packages (ESLint + Prettier)
pnpm lint

# Lint with auto-fix
pnpm lint -- --fix

# Type check all packages
pnpm typecheck

# Format code
pnpm format
```

## Database (Supabase)

```bash
# Start Supabase local
supabase start

# Run database migrations
supabase db push
```

## Cloudflare Workers (API)

```bash
# Start API dev server
cd apps/api && pnpm dev

# Deploy API
cd apps/api && pnpm deploy

# Generate Cloudflare types
cd apps/api && pnpm cf-typegen
```

## Web App

```bash
# Start web dev server
cd apps/web && pnpm dev

# Build web app
cd apps/web && pnpm build

# Preview production build
cd apps/web && pnpm preview
```

## Turborepo

```bash
# Run specific task
turbo run <task>

# Clean all build artifacts
pnpm clean
```

## System Utilities (Darwin/macOS)

```bash
git       # Version control
ls        # List directory
cd        # Change directory
grep      # Search text
find      # Find files
```
