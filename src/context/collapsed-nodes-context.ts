import { createContext, useContext } from "react";

export interface CollapsedNodesContextValue {
	collapsedNodes: Set<string>;
	toggleCollapsed: (nodeId: string) => void;
}

export const CollapsedNodesContext =
	createContext<CollapsedNodesContextValue | null>(null);

export function useCollapsedNodes(): CollapsedNodesContextValue {
	const ctx = useContext(CollapsedNodesContext);
	if (!ctx) {
		// Fallback: everything expanded, toggle is a no-op
		return { collapsedNodes: new Set(), toggleCollapsed: () => {} };
	}
	return ctx;
}
