# AGENTS.md - Schema Visualizer Plugin

Standalone React package (`@infrahub/schema-visualizer`) that provides interactive schema visualization as a reusable component and VS Code webview.

## Commands

```bash
npm install          # Install dependencies
npm run build        # Standard Vite build
npm run build:webview # Webview-specific build
npm run lint         # Biome linting
```

## Guidelines (How to write code)

- `guidelines/naming-conventions.md` - File naming patterns
- `guidelines/typescript.md` - TypeScript and React patterns
- `guidelines/styling.md` - Tailwind CSS and CVA
- `guidelines/component-patterns.md` - Early returns, layout extraction, memoization

## Package Boundaries

This package is consumed by the VS Code extension (webview build) and the main frontend app. Do not depend on:

- `frontend/app` internals (Jotai, React Query, react-router, shared components)
- Node.js-only APIs in component files

Only export from the root `index.ts`. Keep `src/` internals private.
