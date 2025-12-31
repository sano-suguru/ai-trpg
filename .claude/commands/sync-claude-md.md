Sync CLAUDE.md with the current project state:

1. Scan project structure and verify directory layout matches reality
2. Remove outdated content (deleted files, renamed directories, deprecated patterns)
3. Add important new information from recent commits (new conventions, architectural decisions)
4. Fix inaccuracies and update stale references

Display a diff of changes before applying.

---

## Goal

The goal is **accuracy**, not compression. CLAUDE.md should reflect the current state of the project so that Claude can work effectively.

## Guidelines

**DO:**
- Remove information about files/directories that no longer exist
- Update paths and names that have changed
- Add genuinely useful new conventions or patterns discovered
- Consolidate duplicate information into single entries

**DON'T:**
- Remove useful information just to save tokens
- Compress clear explanations into cryptic abbreviations
- Delete context that helps Claude understand the project
- Prioritize brevity over clarity

## When consolidating

Combine redundant entries, but preserve meaning:

```
# Before (redundant)
- Use TypeScript for all code
- TypeScript is required
- All files should be .ts or .tsx

# After (consolidated)
- TypeScript required for all code (.ts/.tsx)
```

This removes duplication while keeping the information intact.
