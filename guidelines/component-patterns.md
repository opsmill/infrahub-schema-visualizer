# Component Patterns

## Early Return Style

Use early returns instead of nested ternaries for components with multiple states.

```tsx
// Bad: Nested ternaries
function NodePanel() {
  return (
    <div>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorMessage />
      ) : (
        <Content />
      )}
    </div>
  );
}

// Good: Early returns
function NodePanel() {
  if (isLoading) return <div><Spinner /></div>;
  if (error) return <div><ErrorMessage /></div>;
  return <div><Content /></div>;
}
```

## Layout Extraction

When multiple early returns share the same wrapper structure, extract a layout component.

```tsx
// Bad: Duplicated wrapper
function FilterPanel() {
  if (isEmpty) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <header>Filter</header>
        <p>No items</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 p-4">
      <header>Filter</header>
      <ul>{/* items */}</ul>
    </div>
  );
}

// Good: Shared layout component
function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <header>Filter</header>
      {children}
    </div>
  );
}

function FilterPanel() {
  if (isEmpty) return <PanelLayout><p>No items</p></PanelLayout>;
  return <PanelLayout><ul>{/* items */}</ul></PanelLayout>;
}
```

Extract when: 3+ returns share the same wrapper, the wrapper has styling logic, structure is unlikely to diverge.

## React Patterns

Derive state during render, not with effects:

```tsx
// Good
const visibleNodes = allNodes.filter(node => !hiddenNodes.has(node.id));

// Bad
const [visibleNodes, setVisibleNodes] = useState([]);
useEffect(() => {
  setVisibleNodes(allNodes.filter(node => !hiddenNodes.has(node.id)));
}, [allNodes, hiddenNodes]);
```

## Memoization

This package targets React 18 (peer dep) and does not use the React Compiler. Use `memo`, `useMemo`, and `useCallback` where profiling shows a real benefit — primarily for expensive computations and stable callback references passed to child components.

```tsx
// memo for pure components receiving complex props
export const SchemaNode = memo(function SchemaNode({ data }: NodeProps) { ... });

// useCallback for handlers passed to ReactFlow or child components
const handleNodeClick = useCallback((...) => { ... }, [deps]);

// useMemo for expensive derived data
const flowData = useMemo(() => schemaToFlowFiltered(...), [deps]);
```
