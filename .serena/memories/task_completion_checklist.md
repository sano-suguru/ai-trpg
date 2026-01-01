# Task Completion Checklist

## After Making Changes

Run these commands before considering a task complete:

```bash
# 1. Lint with auto-fix (ESLint + Prettier)
pnpm lint -- --fix

# 2. Type check
pnpm typecheck
```

## Quality Requirements

- Fix ALL errors AND warnings before task completion
- Treat warnings as errors - do not ignore or defer them
- Ensure no TypeScript errors
- Ensure no ESLint violations
- Code must be properly formatted (Prettier)

## Git Commit Rules

- Use conventional commits format: `type(scope): message`
- Keep commit messages concise
- Do NOT add Claude signature or Co-Authored-By footer
- Language: Japanese or English (match project context)

## Code Review Checklist

- [ ] No security vulnerabilities (OWASP top 10)
- [ ] No over-engineering or unnecessary features
- [ ] No dead code or backward-compatibility hacks
- [ ] Uses Result types instead of try-catch
- [ ] Follows naming conventions
- [ ] Follows file placement conventions
- [ ] No deep relative imports (use `@/` alias)
- [ ] No `any` type usage
