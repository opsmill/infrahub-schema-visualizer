import type { Edge, Node } from "@xyflow/react";
import { useEdgesState, useNodesState } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";

import type { EdgeStyle } from "../components/toolbar/bottom-toolbar";
import type { SchemaVisualizerData } from "../types/schema";
import { getLayoutedElements } from "../utils/layout";
import { type PersistedState, visualizerStore } from "../utils/persistence";
import { schemaToFlowFiltered } from "../utils/schema-to-flow";
import { getDefaultHiddenNodes } from "./use-schema-data";

function applyEdgeStyle(edges: Edge[], edgeStyle: EdgeStyle): Edge[] {
	return edges.map((edge) => ({
		...edge,
		data: { ...edge.data, edgeStyle },
	}));
}

function buildPositionMap(
	state: PersistedState | null,
): Map<string, { x: number; y: number }> | null {
	if (!state?.nodePositions) return null;
	const map = new Map<string, { x: number; y: number }>();
	for (const pos of state.nodePositions) {
		map.set(pos.id, { x: pos.x, y: pos.y });
	}
	return map;
}

export function useGraphLayout(
	data: SchemaVisualizerData,
	options: { nodeSpacing: number; rowSize: number },
	fitView: (opts?: { padding: number }) => void,
) {
	const persistedState = useRef(visualizerStore.load());

	const [edgeStyle, setEdgeStyle] = useState<EdgeStyle>(
		() => persistedState.current?.edgeStyle ?? "smoothstep",
	);
	const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(() =>
		persistedState.current?.hiddenNodes
			? new Set(persistedState.current.hiddenNodes)
			: getDefaultHiddenNodes(data),
	);
	const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(() =>
		persistedState.current?.collapsedNodes
			? new Set(persistedState.current.collapsedNodes)
			: new Set(),
	);
	const [hasCustomizedView, setHasCustomizedView] = useState(
		() => persistedState.current !== null,
	);

	const savedNodePositions = useRef(buildPositionMap(persistedState.current));
	const hasInitialLayout = useRef(false);
	const currentPositionsRef = useRef<Map<string, { x: number; y: number }>>(
		new Map(),
	);

	// Convert schema to flow data — store in ref to avoid unstable object identity
	const flowDataRef = useRef<{ nodes: Node[]; edges: Edge[] }>({
		nodes: [],
		edges: [],
	});
	const prevFlowKeyRef = useRef("");

	const nextFlowData = schemaToFlowFiltered(
		data.nodes,
		data.generics,
		hiddenNodes,
		{
			nodeSpacing: options.nodeSpacing,
			rowSize: options.rowSize,
			profiles: data.profiles,
			templates: data.templates,
		},
	);

	// Derive a stable key from node/edge IDs to detect real changes
	const nextFlowKey = [
		nextFlowData.nodes.map((n) => n.id).join(","),
		nextFlowData.edges.map((e) => e.id).join(","),
	].join("|");

	if (nextFlowKey !== prevFlowKeyRef.current) {
		flowDataRef.current = nextFlowData;
		prevFlowKeyRef.current = nextFlowKey;
	}

	const flowData = flowDataRef.current;

	const [flowNodes, setFlowNodes, onNodesChangeInternal] = useNodesState<Node>(
		[],
	);
	const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<Edge>([]);

	// Track positions on every node change (drag, programmatic update)
	const onNodesChange = (
		changes: Parameters<typeof onNodesChangeInternal>[0],
	) => {
		onNodesChangeInternal(changes);
		for (const change of changes) {
			if (change.type === "position" && change.position) {
				currentPositionsRef.current.set(change.id, { ...change.position });
			}
		}
	};

	// Layout logic
	useEffect(() => {
		const existingPositions = new Map<string, { x: number; y: number }>();

		if (savedNodePositions.current) {
			for (const [id, pos] of savedNodePositions.current) {
				existingPositions.set(id, pos);
			}
			savedNodePositions.current = null;
		}

		for (const [id, pos] of currentPositionsRef.current) {
			existingPositions.set(id, pos);
		}

		const nodesNeedingLayout = flowData.nodes.filter(
			(node) => !existingPositions.has(node.id),
		);

		let finalNodes: Node[];

		if (
			!hasInitialLayout.current ||
			(nodesNeedingLayout.length > 0 &&
				nodesNeedingLayout.length === flowData.nodes.length)
		) {
			const { nodes: layoutedNodes, edges: layoutedEdges } =
				getLayoutedElements(flowData.nodes, flowData.edges, {
					direction: "TB",
				});

			finalNodes = layoutedNodes.map((node) => {
				const existingPos = existingPositions.get(node.id);
				return existingPos ? { ...node, position: existingPos } : node;
			});

			hasInitialLayout.current = true;
			setFlowEdges(applyEdgeStyle(layoutedEdges, edgeStyle));
		} else if (nodesNeedingLayout.length > 0) {
			const maxY =
				Math.max(...Array.from(existingPositions.values()).map((p) => p.y), 0) +
				400;

			finalNodes = flowData.nodes.map((node) => {
				const existingPos = existingPositions.get(node.id);
				if (existingPos) {
					return { ...node, position: existingPos };
				}
				const newIndex = nodesNeedingLayout.indexOf(node);
				const col = newIndex % 4;
				const row = Math.floor(newIndex / 4);
				return {
					...node,
					position: { x: col * 400, y: maxY + row * 400 },
				};
			});

			setFlowEdges(applyEdgeStyle(flowData.edges, edgeStyle));
		} else {
			finalNodes = flowData.nodes.map((node) => {
				const existingPos = existingPositions.get(node.id);
				return {
					...node,
					position: existingPos ?? node.position,
				};
			});

			setFlowEdges(applyEdgeStyle(flowData.edges, edgeStyle));
		}

		setFlowNodes(finalNodes);

		for (const node of finalNodes) {
			currentPositionsRef.current.set(node.id, { ...node.position });
		}
	}, [flowData, edgeStyle, setFlowNodes, setFlowEdges]);

	// Persist state
	useEffect(() => {
		if (flowNodes.length === 0) return;
		visualizerStore.save({
			hiddenNodes: Array.from(hiddenNodes),
			edgeStyle,
			nodePositions: flowNodes.map((n) => ({
				id: n.id,
				x: n.position.x,
				y: n.position.y,
			})),
			collapsedNodes: Array.from(collapsedNodes),
		});
		setHasCustomizedView(true);
	}, [hiddenNodes, edgeStyle, flowNodes, collapsedNodes]);

	const handleResetView = () => {
		const defaultHidden = getDefaultHiddenNodes(data);
		setHiddenNodes(defaultHidden);
		setCollapsedNodes(new Set());
		setEdgeStyle("smoothstep");
		visualizerStore.clear();
		setHasCustomizedView(false);
		savedNodePositions.current = null;
		hasInitialLayout.current = false;
		currentPositionsRef.current.clear();
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
		hiddenNodes,
		setHiddenNodes,
		edgeStyle,
		setEdgeStyle,
		collapsedNodes,
		setCollapsedNodes,
		hasCustomizedView,
		handleResetView,
	};
}
