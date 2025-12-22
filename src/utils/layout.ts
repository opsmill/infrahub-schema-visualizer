import Dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";

export interface LayoutOptions {
	direction?: "TB" | "BT" | "LR" | "RL";
	nodeWidth?: number;
	nodeHeight?: number;
	rankSep?: number;
	nodeSep?: number;
}

export function getLayoutedElements(
	nodes: Node[],
	edges: Edge[],
	options: LayoutOptions = {},
): { nodes: Node[]; edges: Edge[] } {
	const {
		direction = "LR",
		nodeWidth = 300,
		nodeHeight = 200,
		rankSep = 100,
		nodeSep = 50,
	} = options;

	const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

	g.setGraph({
		rankdir: direction,
		ranksep: rankSep,
		nodesep: nodeSep,
	});

	for (const node of nodes) {
		const width = node.measured?.width ?? nodeWidth;
		const height = node.measured?.height ?? nodeHeight;
		g.setNode(node.id, { width, height });
	}

	for (const edge of edges) {
		g.setEdge(edge.source, edge.target);
	}

	Dagre.layout(g);

	const layoutedNodes = nodes.map((node) => {
		const nodeWithPosition = g.node(node.id);
		const width = node.measured?.width ?? nodeWidth;
		const height = node.measured?.height ?? nodeHeight;

		return {
			...node,
			position: {
				x: nodeWithPosition.x - width / 2,
				y: nodeWithPosition.y - height / 2,
			},
		};
	});

	return { nodes: layoutedNodes, edges };
}
