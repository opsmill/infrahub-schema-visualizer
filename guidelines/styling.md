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

## Forbidden

| Don't | Do |
|-------|-----|
| Inline `style={{}}` | Tailwind classes |
| CSS modules | Tailwind utilities |
| Arbitrary color values `bg-[#6366f1]` | Tailwind palette names |
