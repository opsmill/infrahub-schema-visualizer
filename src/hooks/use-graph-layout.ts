import type { Edge, Node } from "@xyflow/react";
import { useEdgesState, useNodesState } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";

import type { EdgeStyle } from "../components/toolbar/bottom-toolbar";
import type { SchemaVisualizerData } from "../types/schema";
import { getLayoutedElements } from "../utils/layout";
import {
	clearPersistedState,
	loadPersistedState,
	savePersistedState,
} from "../utils/persistence";
import { schemaToFlowFiltered } from "../utils/schema-to-flow";
import { getDefaultHiddenNodes } from "./use-schema-data";

export function useGraphLayout(
	data: SchemaVisualizerData,
	options: { nodeSpacing: number; rowSize: number },
	fitView: (opts?: { padding: number }) => void,
) {
	// Load persisted state once
	const persistedState = loadPersistedState();

	const [edgeStyle, setEdgeStyle] = useState<EdgeStyle>(
		() => persistedState?.edgeStyle ?? "smoothstep",
	);

	const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(() => {
		if (persistedState?.hiddenNodes) {
			return new Set(persistedState.hiddenNodes);
		}
		return getDefaultHiddenNodes(data);
	});

	const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(() => {
		if (persistedState?.collapsedNodes) {
			return new Set(persistedState.collapsedNodes);
		}
		return new Set();
	});

	const [hasCustomizedView, setHasCustomizedView] = useState(
		() => persistedState !== null,
	);

	// Saved node positions from persistence
	const savedNodePositions = (() => {
		if (!persistedState?.nodePositions) return null;
		const posMap = new Map<string, { x: number; y: number }>();
		for (const pos of persistedState.nodePositions) {
			posMap.set(pos.id, { x: pos.x, y: pos.y });
		}
		return posMap;
	})();

	const appliedSavedPositions = useRef(false);
	const hasInitialLayout = useRef(false);
	const currentPositionsRef = useRef<Map<string, { x: number; y: number }>>(
		new Map(),
	);

	// Convert schema to flow data
	const flowData = schemaToFlowFiltered(
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

		if (savedNodePositions && !appliedSavedPositions.current) {
			for (const [id, pos] of savedNodePositions) {
				existingPositions.set(id, pos);
			}
			appliedSavedPositions.current = true;
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

			const edgesWithStyle = layoutedEdges.map((edge) => ({
				...edge,
				data: { ...edge.data, edgeStyle },
			}));
			setFlowEdges(edgesWithStyle);
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

			const edgesWithStyle = flowData.edges.map((edge) => ({
				...edge,
				data: { ...edge.data, edgeStyle },
			}));
			setFlowEdges(edgesWithStyle);
		} else {
			finalNodes = flowData.nodes.map((node) => {
				const existingPos = existingPositions.get(node.id);
				return {
					...node,
					position: existingPos ?? node.position,
				};
			});

			const edgesWithStyle = flowData.edges.map((edge) => ({
				...edge,
				data: { ...edge.data, edgeStyle },
			}));
			setFlowEdges(edgesWithStyle);
		}

		setFlowNodes(finalNodes);

		// Seed position ref so onNodesChange has correct initial state
		for (const node of finalNodes) {
			currentPositionsRef.current.set(node.id, { ...node.position });
		}
	}, [flowData, edgeStyle, setFlowNodes, setFlowEdges, savedNodePositions]);

	// Persist state
	useEffect(() => {
		if (flowNodes.length === 0) return;
		savePersistedState({
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
		clearPersistedState();
		setHasCustomizedView(false);
		appliedSavedPositions.current = false;
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
