# @infrahub/schema-visualizer

An interactive graph visualization component for Infrahub schema data. Built with React Flow, it displays nodes, profiles, templates, and their relationships in a draggable, zoomable canvas.

## Features

- Interactive graph visualization of schema relationships
- Automatic layout using Dagre algorithm
- Filter panel to show/hide schema types by namespace
- Node details panel showing attributes and relationships
- Context menus for nodes and edges
- Export graph as PNG image
- Zoom, pan, and fit-to-view controls
- Visual distinction between schema types (nodes, profiles, templates)
- Animated edges for "many" cardinality relationships
- Self-referencing relationship indicators
- State persistence to localStorage

## Schema Types and Colors

| Type | Color | Description |
|------|-------|-------------|
| Node | Indigo | Core schema nodes |
| Profile | Pink | Profile schemas |
| Template | Amber | Template schemas |
| Generic | Emerald | Generic schemas (rendered as inheritance) |

## Installation

```bash
npm install @infrahub/schema-visualizer
```

## Usage

```tsx
import { SchemaVisualizer, type SchemaVisualizerData } from "@infrahub/schema-visualizer";

const schemaData: SchemaVisualizerData = {
  nodes: [...],      // Array of NodeSchema
  generics: [...],   // Array of GenericSchema
  profiles: [...],   // Array of ProfileSchema
  templates: [...],  // Array of TemplateSchema
};

function App() {
  return (
    <SchemaVisualizer
      data={schemaData}
      className="h-screen w-full"
    />
  );
}
```

## Exports

### Components

- `SchemaVisualizer` - Main visualization component
- `SchemaNode` - Custom node renderer
- `FilterPanel` - Schema type filtering panel
- `NodeDetailsPanel` - Schema details side panel
- `BottomToolbar` - Zoom and layout controls

### Types

- `SchemaVisualizerData` - Input data structure
- `NodeSchema`, `ProfileSchema`, `TemplateSchema`, `GenericSchema` - Schema type definitions
- `AttributeSchema`, `RelationshipSchema` - Schema property definitions

### Utilities

- `schemaToFlow` - Convert schema data to React Flow format
- `schemaToFlowFiltered` - Convert with filtering support
- `applyNamespaceLayout` - Apply Dagre layout grouped by namespace
- `groupByNamespace` - Group schemas by their namespace
- `cn` - Tailwind class name utility

## Tech Stack

- [React 19](https://react.dev/)
- [@xyflow/react](https://reactflow.dev/) (React Flow) - Graph visualization
- [Tailwind CSS 4](https://tailwindcss.com/) - Styling
- [@dagrejs/dagre](https://github.com/dagrejs/dagre) - Automatic graph layout
- [@iconify-icon/react](https://iconify.design/) - Icons
- [html-to-image](https://github.com/bubkoo/html-to-image) - PNG export

## Development

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Build webview bundle (for VSCode extension)
npm run build:webview

# Type check
npx tsc --noEmit
```

## Webview Bundle

This package includes a self-contained webview bundle for use in VSCode extensions:

```javascript
// Import the pre-built bundle
import "@infrahub/schema-visualizer/webview";
import "@infrahub/schema-visualizer/webview/styles";
```

## Credits

Initial design by [@peynadol](https://github.com/peynadol)

## License

Apache License 2.0
