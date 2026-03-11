# File Naming Conventions

## File Suffixes

| Suffix | Purpose | Example |
|--------|---------|---------|
| `.tsx` | React component | `SchemaNode.tsx` |
| `.ts` | TypeScript module | `SchemaToFlow.ts` |
| `.test.ts(x)` | Test (colocated) | `SchemaNode.test.tsx` |

## Directory Patterns

| Directory | Pattern | Example |
|-----------|---------|---------|
| `src/components/` | `PascalCase.tsx` | `FilterPanel.tsx` |
| `src/utils/` | `PascalCase.ts` | `SchemaToFlow.ts` |
| `src/types/` | `PascalCase.ts` | `Schema.ts` |

## Rules

- All files: `PascalCase`
- Tests: colocate with source, never in `__tests__/`
- Avoid `index.ts` barrel exports inside `src/` subdirectories; prefer direct imports
