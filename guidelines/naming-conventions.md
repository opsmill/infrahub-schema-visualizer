# File Naming Conventions

## File Suffixes

| Suffix | Purpose | Example |
|--------|---------|---------|
| `.tsx` | React component | `schema-node.tsx` |
| `.ts` | TypeScript module | `schema-to-flow.ts` |
| `.test.ts(x)` | Test (colocated) | `schema-node.test.tsx` |

## Directory Patterns

| Directory | Pattern | Example |
|-----------|---------|---------|
| `src/components/` | `kebab-case.tsx` | `filter-panel.tsx` |
| `src/utils/` | `kebab-case.ts` | `schema-to-flow.ts` |
| `src/types/` | `kebab-case.ts` | `schema.ts` |

## Rules

- All files: `kebab-case`
- Tests: colocate with source, never in `__tests__/`
- Avoid `index.ts` barrel exports inside `src/` subdirectories; prefer direct imports
