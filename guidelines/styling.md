# Styling Guidelines

## classNames Utility

Use `cn` from `../utils/cn` for conditional class merging:

```tsx
import { cn } from "../utils/cn";

className={cn("base-class", isActive && "active", className)}
```

Use for: conditionals, CVA merging, `className` prop override.
Skip for: static class strings.

## Layout

No shared layout primitives (`Row`, `Col`) are available in this package. Use Tailwind flex utilities directly:

```tsx
// Horizontal layout
<div className="flex items-center gap-2">...</div>

// Vertical layout
<div className="flex flex-col gap-4">...</div>
```

## CVA (Class Variance Authority)

Use when a component has 2+ predefined visual variants:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva("inline-flex items-center rounded", {
  variants: {
    variant: {
      primary: "bg-indigo-500 text-white hover:bg-indigo-600",
      ghost: "hover:bg-gray-100 text-gray-600",
    },
  },
  defaultVariants: { variant: "ghost" },
});

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, className, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant }), className)} {...props} />
  );
}
```

## Theme Tokens

All colors come from the `--sv-*` custom properties in `src/theme.css`
(light values on `:root` and `.schema-visualizer`, dark overrides under
`[data-theme="dark"]`). Use the Tailwind v4 var shorthand:

```tsx
// Surfaces, borders, text
<div className="bg-(--sv-surface) border-(--sv-border) text-(--sv-text-2)" />

// Schema-type categorical colors (fills vs. text roles)
<div className="bg-(--sv-profile)" />
<span className="text-(--sv-profile-text)" />
```

In JS-side styles (edge strokes, box shadows), use `var()` with the light
hex as fallback so utility-only consumers keep working without the token
stylesheet: `stroke: "var(--sv-node, #087895)"`.

When adding a new color, define it as a token pair (light + dark) in
`src/theme.css` — never hardcode a palette class or hex in a component.

## Forbidden

| Don't | Do |
|-------|-----|
| Inline `style={{}}` | Tailwind classes |
| CSS modules | Tailwind utilities |
| Palette classes `text-gray-600` or hexes `bg-[#6366f1]` | Theme tokens `text-(--sv-text-3)`, `bg-(--sv-accent)` |
| Theme detection in the package (`matchMedia`, OS queries) | `theme` prop from the embedder |
