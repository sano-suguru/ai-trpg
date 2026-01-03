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

| Type                    | Location                              |
| ----------------------- | ------------------------------------- |
| Domain models           | `shared/domain/{entity}/`             |
| Domain primitives (IDs) | `shared/domain/primitives/`           |
| Error types             | `shared/types/`                       |
| Zod schemas             | `shared/schemas/`                     |
| Master data             | `shared/constants/`                   |
| UI components           | `web/components/{domain}/`            |
| Feature slices          | `api/features/{domain}/`              |
| DB schema               | `api/infrastructure/database/schema/` |

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
- Use `Errors.*` factory functions
- Wrap external promises with `wrapPromise()`, `wrapDbOperation()`, `wrapExternalCall()`
- Use `fromNullable()` for nullable values
- Use `tryCatch()` only at boundaries with external libraries

## API Naming Conventions (tRPC)

| Pattern                        | Auth         | Purpose               |
| ------------------------------ | ------------ | --------------------- |
| `get` / `list`                 | Not required | Public data retrieval |
| `getMine` / `listMine`         | Required     | Own data retrieval    |
| `create` / `update` / `delete` | Required     | Data modification     |

**Prohibited**: Ad-hoc naming for backward compatibility. Rename existing code instead of adding awkwardly named alternatives (e.g., don't add `getPublic` when you should rename `get` to `getMine`).

## Prohibited Practices

- Circular dependencies
- Deep relative paths - use `@/` alias
- `any` type - use `unknown` with type guards
- `console.log` in production code
- `try-catch` for control flow
- `throw` statements - return `err()` instead
- Ignoring lint warnings
- Dead code for "backward compatibility"
- File extensions in imports
