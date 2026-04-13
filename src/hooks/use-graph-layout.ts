import type { Edge, Node } from "@xyflow/react";
import { useEdgesState, useNodesState } from "@xyflow/react";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";

import type { EdgeStyle } from "../components/toolbar/bottom-toolbar";
import {
	clearAllStorage,
	collapsedNodesSetAtom,
	edgeStyleAtom,
	hasCustomizedViewAtom,
	hiddenNodesSetAtom,
	nodePositionsMapAtom,
} from "../store/visualizer-atoms";
import type { SchemaVisualizerData } from "../types/schema";
import { getLayoutedElements } from "../utils/layout";
import { schemaToFlowFiltered } from "../utils/schema-to-flow";
import { getAllSchemaKinds, getDefaultHiddenNodes } from "./use-schema-data";

function applyEdgeStyle(edges: Edge[], edgeStyle: EdgeStyle): Edge[] {
	return edges.map((edge) => ({
		...edge,
		data: { ...edge.data, edgeStyle },
	}));
}

function collectPositions(
	nodes: Node[],
): Map<string, { x: number; y: number }> {
	const positions = new Map<string, { x: number; y: number }>();
	for (const n of nodes) {
		positions.set(n.id, { x: n.position.x, y: n.position.y });
	}
	return positions;
}

/**
 * Compute positioned nodes + styled edges from schema data.
 * Applies saved positions where available, dagre layout for the rest.
 */
function buildFlowData(
	data: SchemaVisualizerData,
	hiddenNodes: Set<string>,
	edgeStyle: EdgeStyle,
	savedPositions: Map<string, { x: number; y: number }>,
	options: { nodeSpacing: number; rowSize: number },
): { nodes: Node[]; edges: Edge[] } {
	const raw = schemaToFlowFiltered(data.nodes, data.generics, hiddenNodes, {
		nodeSpacing: options.nodeSpacing,
		rowSize: options.rowSize,
		profiles: data.profiles,
		templates: data.templates,
	});

	const nodesNeedingLayout = raw.nodes.filter((n) => !savedPositions.has(n.id));

	let nodes: Node[];

	if (
		nodesNeedingLayout.length === 0 &&
		raw.nodes.length > 0 &&
		savedPositions.size > 0
	) {
		nodes = raw.nodes.map((node) => ({
			...node,
			position: savedPositions.get(node.id) ?? node.position,
		}));
	} else if (
		nodesNeedingLayout.length > 0 &&
		nodesNeedingLayout.length < raw.nodes.length
	) {
		const maxY =
			Math.max(...Array.from(savedPositions.values()).map((p) => p.y), 0) + 400;

		nodes = raw.nodes.map((node) => {
			const saved = savedPositions.get(node.id);
			if (saved) return { ...node, position: saved };
			const idx = nodesNeedingLayout.indexOf(node);
			return {
				...node,
				position: {
					x: (idx % options.rowSize) * options.nodeSpacing,
					y: maxY + Math.floor(idx / options.rowSize) * options.nodeSpacing,
				},
			};
		});
	} else {
		const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(
			raw.nodes,
			raw.edges,
			{ direction: "TB" },
		);

		nodes = layouted.map((node) => {
			const saved = savedPositions.get(node.id);
			return saved ? { ...node, position: saved } : node;
		});

		return { nodes, edges: applyEdgeStyle(layoutedEdges, edgeStyle) };
	}

	return { nodes, edges: applyEdgeStyle(raw.edges, edgeStyle) };
}

export function useGraphLayout(
	data: SchemaVisualizerData,
	options: { nodeSpacing: number; rowSize: number },
	fitView: (opts?: { padding: number }) => void,
) {
	const [hiddenNodesRaw, setHiddenNodes] = useAtom(hiddenNodesSetAtom);
	const [, setCollapsedNodes] = useAtom(collapsedNodesSetAtom);
	const [edgeStyle, setEdgeStyle] = useAtom(edgeStyleAtom);
	const [savedPositions, setSavedPositions] = useAtom(nodePositionsMapAtom);
	const [hasCustomizedView, setHasCustomizedView] = useAtom(
		hasCustomizedViewAtom,
	);

	// On first load with no localStorage, apply default filters synchronously
	// to avoid a wasted render cycle with all nodes visible before defaults apply.
	const needsDefaults = hiddenNodesRaw.size === 0 && !hasCustomizedView;
	const hiddenNodes = needsDefaults
		? getDefaultHiddenNodes(data)
		: hiddenNodesRaw;

	// Persist defaults to the atom so the filter panel reflects them.
	const didInit = useRef(false);
	if (!didInit.current) {
		didInit.current = true;
		if (needsDefaults) {
			setHiddenNodes(hiddenNodes);
			setCollapsedNodes(getAllSchemaKinds(data));
		}
	}

	// Compute flow data. React Compiler memoises this.
	const computed = buildFlowData(
		data,
		hiddenNodes,
		edgeStyle,
		savedPositions,
		options,
	);

	// Derive a stable key from node+edge IDs to detect real changes
	const flowKey = [
		computed.nodes.map((n) => n.id).join(","),
		computed.edges.map((e) => e.id).join(","),
		edgeStyle,
	].join("|");

	const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<Node>(
		computed.nodes,
	);
	const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<Edge>(
		computed.edges,
	);

	// Sync computed data → ReactFlow when filters/edge style change.
	const prevFlowKeyRef = useRef(flowKey);
	useEffect(() => {
		if (flowKey === prevFlowKeyRef.current) return;
		prevFlowKeyRef.current = flowKey;
		setFlowNodes(computed.nodes);
		setFlowEdges(computed.edges);
	}, [flowKey, computed, setFlowNodes, setFlowEdges]);

	const persistPositions = (nodes: Node[]) => {
		setSavedPositions(collectPositions(nodes));
		setHasCustomizedView(true);
	};

	const handleLayout = (
		direction: "TB" | "LR",
		currentNodes: Node[],
		currentEdges: Edge[],
	) => {
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			currentNodes,
			currentEdges,
			{ direction },
		);
		const styledEdges = applyEdgeStyle(layoutedEdges, edgeStyle);

		setFlowNodes(layoutedNodes);
		setFlowEdges(styledEdges);
		persistPositions(layoutedNodes);

		requestAnimationFrame(() => {
			fitView({ padding: 0.2 });
		});
	};

	const handleResetView = () => {
		clearAllStorage();
		setHiddenNodes(getDefaultHiddenNodes(data));
		setCollapsedNodes(getAllSchemaKinds(data));
		setEdgeStyle("smoothstep");
		setSavedPositions(new Map());
		setHasCustomizedView(false);
		prevFlowKeyRef.current = "";
		setTimeout(() => {
			fitView({ padding: 0.2 });
		}, 100);
	};

	return {
		flowNodes,
		flowEdges,
		setFlowNodes,
		setFlowEdges,
		onNodesChange,
		onEdgesChange,
		persistPositions,
		hiddenNodes,
		setHiddenNodes,
		edgeStyle,
		setEdgeStyle,
		hasCustomizedView,
		handleResetView,
		handleLayout,
	};
}
