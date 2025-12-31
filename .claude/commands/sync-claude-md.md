Sync CLAUDE.md with the current project state:

1. Scan project structure and verify directory layout is accurate
2. Remove outdated content (deleted files, changed patterns)
3. Extract and add important design decisions from recent commits
4. Streamline verbose descriptions for token efficiency

Display a diff of changes before applying.

---

Accumulated fragmented additions cause CLAUDE.md to bloat with duplications, degrading quality. This increases token consumption and risks reducing Claude's instruction adherence.

**Keeping CLAUDE.md small is the top priority.**
```
# Bad: Verbose
"This project uses TypeScript.
TypeScript is a language that provides type safety..."

# Good: Concise
"TypeScript strict mode. Type definitions consolidated under @types/."
```

Prioritize "consolidation" over "appending" when updating.
