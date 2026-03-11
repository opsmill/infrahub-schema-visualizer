# TypeScript Coding Standards

## Exports

- **Named exports** for all components, hooks, utilities
- **No default exports**

## Components

### Props

```tsx
// Extend HTML attributes for primitive wrappers
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

// Discriminated unions when behavior differs
type PanelProps =
  | { mode: "filter"; onToggle: () => void }
  | { mode: "details"; schema: NodeSchema };
```

## Hooks

- Prefix: `use*`
- Let TypeScript infer return types (annotate only when complex)
- Include all deps in `useEffect`/`useCallback`/`useMemo` arrays

## Type Safety

| Forbidden | Use Instead |
|-----------|-------------|
| `any` | `unknown` + type guards |
| `!` (non-null assertion) | Null check first |
| `as` (type assertion) | Type guard validation |

## Inference

| Annotate | Let Infer |
|----------|-----------|
| Function parameters | Local variables |
| Public API return types | Internal return types |
| Component props | Derived values |

## Imports

- No `@/` alias — use relative paths: `import { cn } from "../utils/cn"`
- Biome handles import order (`npm run lint`)

## Constants

- Module-level: `SCREAMING_SNAKE_CASE`
- Object/array constants: `PascalCase` with `as const`
