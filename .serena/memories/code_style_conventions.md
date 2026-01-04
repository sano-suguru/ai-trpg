# Code Style and Conventions

## Naming Conventions

| Target              | Convention       | Example             |
| ------------------- | ---------------- | ------------------- |
| Directories         | kebab-case       | `character-sheet/`  |
| TS files            | camelCase.ts     | `characterStore.ts` |
| React components    | PascalCase.tsx   | `CharacterCard.tsx` |
| Types/Interfaces    | PascalCase       | `Character`         |
| Functions/Variables | camelCase        | `createCharacter()` |
| Constants           | UPPER_SNAKE_CASE | `MAX_PARTY_SIZE`    |

## File Placement

| Type                          | Location                              |
| ----------------------------- | ------------------------------------- |
| Domain models                 | `shared/domain/{entity}/`             |
| Domain primitives (IDs)       | `shared/domain/primitives/`           |
| Error types                   | `shared/types/`                       |
| Zod schemas                   | `shared/schemas/`                     |
| Master data (game constants)  | `shared/constants/`                   |
| Test fixtures (seed metadata) | `shared/fixtures/`                    |
| Seed data (dev/demo samples)  | `api/scripts/data/`                   |
| UI components                 | `web/components/{domain}/`            |
| Feature slices                | `api/features/{domain}/`              |
| DB schema                     | `api/infrastructure/database/schema/` |

## Import Style

- **No file extensions** in import statements
- Use `import { foo } from "./bar"` not `import { foo } from "./bar.js"`
- Project uses `moduleResolution: "Bundler"`
- Use `@/` alias instead of deep relative paths (`../../../`)

## Architecture Patterns

### Functional Domain Modeling (FDM)

- Branded Types for type-safe IDs (`UserId`, `CharacterId`)
- Smart Constructors returning `Result<T, ValidationError>`
- Immutable by default with `readonly` modifiers
- Discriminated Unions for states and errors

### Vertical Slice Architecture

- Feature-based organization in `api/features/{domain}/`
- Each feature: `router.ts`, `repository.ts`, `mapper.ts`, `useCases/`
- Dependencies injected via function parameters

### Error Handling (neverthrow)

- Use `Result<T, E>` and `ResultAsync<T, E>` - NEVER try-catch for control flow
- Use `Errors.*` factory functions to create errors
- Wrap external promises with `wrapPromise()`, `wrapDbOperation()`, `wrapExternalCall()`
- Use `fromNullable()` for nullable values
- Use `tryCatch()` only at boundaries with external libraries
- Exception: CLI scripts and entry points may use try-catch for top-level error handling

## API Naming Conventions (tRPC)

| Pattern                        | Auth         | Purpose               |
| ------------------------------ | ------------ | --------------------- |
| `get` / `list`                 | Not required | Public data retrieval |
| `getMine` / `listMine`         | Required     | Own data retrieval    |
| `create` / `update` / `delete` | Required     | Data modification     |

## Prohibited Practices

- Circular dependencies
- Deep relative paths - use `@/` alias
- `any` type - use `unknown` with type guards
- `console.log` in production code (ESLint `no-console` enforced)
- `try-catch` for control flow - use Result types
- `throw` statements - return `err()` instead (ESLint `functional/no-throw-statements` enforced)
- Ignoring lint warnings - always fix them
- Dead code for "backward compatibility" - delete unused code immediately
- File extensions (`.js`/`.ts`) in import statements
- Ad-hoc naming for backward compatibility - rename existing code instead

## ESLint Escape Hatches

When `throw` is unavoidable:
- Router files (`**/router.ts`, `**/trpc/**/*.ts`): Automatically exempt for TRPCError
- Test files (`**/*.spec.ts`, `**/*.test.ts`, `**/e2e/**/*.ts`): Automatically exempt
- Scripts (`**/scripts/**/*.ts`): Automatically exempt
- Entry point checks: Use inline disable comment with explanation
