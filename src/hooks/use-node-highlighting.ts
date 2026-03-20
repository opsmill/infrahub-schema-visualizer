import type { Edge, Node } from "@xyflow/react";

/**
 * Compute connected node IDs for a hovered node.
 */
export function getConnectedNodeIds(
	hoveredId: string | null,
	edges: Edge[],
): Set<string> | null {
	if (!hoveredId) return null;
	const connected = new Set<string>([hoveredId]);
	for (const edge of edges) {
		if (edge.source === hoveredId) connected.add(edge.target);
		if (edge.target === hoveredId) connected.add(edge.source);
	}
	return connected;
}

/**
 * Get the two node IDs connected by a highlighted edge.
 */
export function getHighlightedEdgeNodes(
	highlightedEdgeId: string | null,
	edges: Edge[],
): Set<string> | null {
	if (!highlightedEdgeId) return null;
	const edge = edges.find((e) => e.id === highlightedEdgeId);
	if (!edge) return null;
	return new Set([edge.source, edge.target]);
}

/**
 * Apply dimming/highlighting styles to nodes based on hover and edge highlight state.
 */
export function getStyledNodes(
	flowNodes: Node[],
	connectedNodeIds: Set<string> | null,
	filterHoveredNodeId: string | null,
	highlightedEdgeNodes: Set<string> | null,
): Node[] {
	if (!connectedNodeIds && !filterHoveredNodeId && !highlightedEdgeNodes) {
		return flowNodes;
	}
	return flowNodes.map((node) => {
		const isHighlighted = filterHoveredNodeId === node.id;
		const isConnected = connectedNodeIds?.has(node.id) ?? true;
		const isEdgeConnected = highlightedEdgeNodes?.has(node.id) ?? true;
		const shouldDim =
			(connectedNodeIds && !isConnected) ||
			(highlightedEdgeNodes && !isEdgeConnected);
		return {
			...node,
			style: {
				...node.style,
				opacity: shouldDim ? 0.25 : 1,
				transition: "opacity 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
				boxShadow: isHighlighted
					? "0 0 0 3px #6366f1, 0 0 20px rgba(99, 102, 241, 0.4)"
					: undefined,
				borderRadius: isHighlighted ? "8px" : undefined,
			},
		};
	});
}

/**
 * Apply dimming/highlighting styles to edges based on hover and edge highlight state.
 */
export function getStyledEdges(
	flowEdges: Edge[],
	activeHoveredId: string | null,
	highlightedEdgeId: string | null,
): Edge[] {
	if (!activeHoveredId && !highlightedEdgeId) return flowEdges;
	return flowEdges.map((edge) => {
		const isConnectedToHover =
			activeHoveredId &&
			(edge.source === activeHoveredId || edge.target === activeHoveredId);
		const isHighlighted = highlightedEdgeId === edge.id;
		const shouldDim =
			(activeHoveredId && !isConnectedToHover) ||
			(highlightedEdgeId && !isHighlighted);
		return {
			...edge,
			style: {
				...edge.style,
				opacity: shouldDim ? 0.15 : 1,
				strokeWidth: isHighlighted ? 3 : (edge.style?.strokeWidth ?? 2),
				transition: "opacity 0.2s ease-in-out, stroke-width 0.2s ease-in-out",
			},
		};
	});
}
