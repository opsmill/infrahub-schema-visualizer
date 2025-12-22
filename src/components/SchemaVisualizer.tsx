import {
	Background,
	BackgroundVariant,
	ConnectionMode,
	type Edge,
	type EdgeTypes,
	getNodesBounds,
	getViewportForBounds,
	type Node,
	type NodeTypes,
	Panel,
	ReactFlow,
	ReactFlowProvider,
	SelectionMode,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";

import type {
	NodeSchema,
	ProfileSchema,
	SchemaVisualizerData,
	TemplateSchema,
} from "../types/schema";
import { cn } from "../utils/cn";
import { getLayoutedElements } from "../utils/layout";
import {
	clearPersistedState,
	loadPersistedState,
	savePersistedState,
} from "../utils/persistence";
import { getSchemaKind, schemaToFlowFiltered } from "../utils/schema-to-flow";
import {
	BottomToolbar,
	type EdgeStyle,
	type ExportFormat,
	type LayoutDirection,
} from "./BottomToolbar";
import { EdgeContextMenu, type EdgeInfo } from "./EdgeContextMenu";
import { FilterPanel } from "./FilterPanel";
import { FloatingEdge } from "./FloatingEdge";
import { LegendPanel } from "./LegendPanel";
import { NodeContextMenu } from "./NodeContextMenu";
import { NodeDetailsPanel } from "./NodeDetailsPanel";
import { SchemaNode } from "./SchemaNode";

const nodeTypes: NodeTypes = {
	schemaNode: SchemaNode,
};

const edgeTypes: EdgeTypes = {
	floating: FloatingEdge,
};

// Compute default hidden nodes based on schema data
function getDefaultHiddenNodes(data: SchemaVisualizerData): Set<string> {
	const hidden = new Set<string>();
	const hiddenNamespaces = ["Core", "Builtin"];
	// Hide nodes from hidden namespaces
	for (const node of data.nodes) {
		if (hiddenNamespaces.includes(node.namespace)) {
			hidden.add(getSchemaKind(node));
		}
	}
	// Hide all profiles by default
	for (const profile of data.profiles ?? []) {
		hidden.add(getSchemaKind(profile));
	}
	// Hide all templates by default
	for (const template of data.templates ?? []) {
		hidden.add(getSchemaKind(template));
	}
	return hidden;
}

export interface SchemaVisualizerProps {
	/**
	 * Schema data to visualize. Contains nodes and generics.
	 */
	data: SchemaVisualizerData;

	/**
	 * Optional CSS class name for the container
	 */
	className?: string;

	/**
	 * Whether to show the background grid
	 * @default true
	 */
	showBackground?: boolean;

	/**
	 * Number of nodes per row in grid layout
	 * @default 4
	 */
	rowSize?: number;

	/**
	 * Spacing between nodes
	 * @default 400
	 */
	nodeSpacing?: number;

	/**
	 * Callback when a node is clicked
	 */
	onNodeClick?: (nodeId: string, schema: NodeSchema) => void;

	/**
	 * Whether to show the filter panel initially
	 * @default false
	 */
	defaultFilterOpen?: boolean;

	/**
	 * Whether to show the node details panel when a node is selected
	 * @default true
	 */
	showNodeDetails?: boolean;

	/**
	 * Whether to show the bottom toolbar
	 * @default true
	 */
	showToolbar?: boolean;

	/**
	 * Whether to show the stats panel
	 * @default true
	 */
	showStats?: boolean;
}

// Inner component that has access to ReactFlow context
function SchemaVisualizerInner({
	data,
	className,
	showBackground = true,
	rowSize = 4,
	nodeSpacing = 400,
	onNodeClick,
	defaultFilterOpen = false,
	showNodeDetails = true,
	showToolbar = true,
	showStats = true,
}: SchemaVisualizerProps) {
	const { setCenter, getNode, fitView } = useReactFlow();

	const [isFilterOpen, setIsFilterOpen] = useState(defaultFilterOpen);
	const [selectedNodeKind, setSelectedNodeKind] = useState<string | null>(null);
	const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
	const [filterHoveredNodeId, setFilterHoveredNodeId] = useState<string | null>(
		null,
	);
	const [contextMenu, setContextMenu] = useState<{
		nodeId: string;
		x: number;
		y: number;
	} | null>(null);
	const [edgeContextMenu, setEdgeContextMenu] = useState<{
		edge: EdgeInfo;
		x: number;
		y: number;
	} | null>(null);
	const [highlightedEdgeId, setHighlightedEdgeId] = useState<string | null>(
		null,
	);

	// Load persisted state or use defaults
	const persistedState = useMemo(() => loadPersistedState(), []);

	const [edgeStyle, setEdgeStyle] = useState<EdgeStyle>(
		() => persistedState?.edgeStyle ?? "smoothstep",
	);

	// Initialize hidden nodes from persisted state or defaults
	const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(() => {
		if (persistedState?.hiddenNodes) {
			return new Set(persistedState.hiddenNodes);
		}
		return getDefaultHiddenNodes(data);
	});

	// Track if user has customized the view (for showing reset button)
	const [hasCustomizedView, setHasCustomizedView] = useState(
		() => persistedState !== null,
	);

	// Store saved node positions to apply after layout
	const savedNodePositions = useMemo(() => {
		if (!persistedState?.nodePositions) return null;
		const posMap = new Map<string, { x: number; y: number }>();
		for (const pos of persistedState.nodePositions) {
			posMap.set(pos.id, { x: pos.x, y: pos.y });
		}
		return posMap;
	}, [persistedState]);

	// Ref to track if we've applied saved positions (only do once on initial load)
	const appliedSavedPositions = useRef(false);

	// Track whether we've done the initial layout (declared before usage in handleResetView)
	const hasInitialLayout = useRef(false);

	// Store current node positions map for preserving positions when filtering
	const currentPositionsRef = useRef<Map<string, { x: number; y: number }>>(
		new Map(),
	);

	// Reset to default view
	const handleResetView = useCallback(() => {
		const defaultHidden = getDefaultHiddenNodes(data);
		setHiddenNodes(defaultHidden);
		setEdgeStyle("smoothstep");
		clearPersistedState();
		setHasCustomizedView(false);
		// Reset the saved positions flag so next load uses defaults
		appliedSavedPositions.current = false;
		// Reset layout flag and clear positions to force full recalculation
		hasInitialLayout.current = false;
		currentPositionsRef.current.clear();
		// Fit view after layout recalculates (need small delay for React state + layout)
		setTimeout(() => {
			fitView({ padding: 0.2 });
		}, 100);
	}, [data, fitView]);

	// Type for schema items with their type info
	type SchemaItem = {
		schema: NodeSchema | ProfileSchema | TemplateSchema;
		type: "node" | "profile" | "template";
	};

	// Group all schemas by namespace
	const namespaceSchemas = useMemo(() => {
		const groups = new Map<string, SchemaItem[]>();
		for (const node of data.nodes) {
			if (!groups.has(node.namespace)) {
				groups.set(node.namespace, []);
			}
			groups.get(node.namespace)?.push({ schema: node, type: "node" });
		}
		for (const profile of data.profiles ?? []) {
			if (!groups.has(profile.namespace)) {
				groups.set(profile.namespace, []);
			}
			groups.get(profile.namespace)?.push({ schema: profile, type: "profile" });
		}
		for (const template of data.templates ?? []) {
			if (!groups.has(template.namespace)) {
				groups.set(template.namespace, []);
			}
			groups
				.get(template.namespace)
				?.push({ schema: template, type: "template" });
		}
		return groups;
	}, [data.nodes, data.profiles, data.templates]);

	// Get visible schemas count
	const visibleSchemasCount = useMemo(() => {
		let count = 0;
		count += data.nodes.filter(
			(node) => !hiddenNodes.has(getSchemaKind(node)),
		).length;
		count += (data.profiles ?? []).filter(
			(profile) => !hiddenNodes.has(getSchemaKind(profile)),
		).length;
		count += (data.templates ?? []).filter(
			(template) => !hiddenNodes.has(getSchemaKind(template)),
		).length;
		return count;
	}, [data.nodes, data.profiles, data.templates, hiddenNodes]);

	// Get total schemas count
	const totalSchemasCount = useMemo(() => {
		return (
			data.nodes.length +
			(data.profiles?.length ?? 0) +
			(data.templates?.length ?? 0)
		);
	}, [data.nodes.length, data.profiles?.length, data.templates?.length]);

	// Convert schema to flow data
	const flowData = useMemo(() => {
		return schemaToFlowFiltered(data.nodes, data.generics, hiddenNodes, {
			nodeSpacing,
			rowSize,
			profiles: data.profiles,
			templates: data.templates,
		});
	}, [
		data.nodes,
		data.generics,
		data.profiles,
		data.templates,
		hiddenNodes,
		nodeSpacing,
		rowSize,
	]);

	const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<Node>([]);
	const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<Edge>([]);

	// Update positions ref whenever flowNodes change
	useEffect(() => {
		for (const node of flowNodes) {
			currentPositionsRef.current.set(node.id, { ...node.position });
		}
	}, [flowNodes]);

	// Initial layout or when showing previously hidden nodes (need layout for new nodes)
	useEffect(() => {
		// Build a map of existing positions (from ref or saved state)
		const existingPositions = new Map<string, { x: number; y: number }>();

		// First, use saved positions if this is initial load
		if (savedNodePositions && !appliedSavedPositions.current) {
			for (const [id, pos] of savedNodePositions) {
				existingPositions.set(id, pos);
			}
			appliedSavedPositions.current = true;
		}

		// Then, overlay with current positions from ref (these take priority)
		for (const [id, pos] of currentPositionsRef.current) {
			existingPositions.set(id, pos);
		}

		// Find which nodes need layout (don't have existing positions)
		const nodesNeedingLayout = flowData.nodes.filter(
			(node) => !existingPositions.has(node.id),
		);

		let finalNodes: Node[];

		if (
			!hasInitialLayout.current ||
			(nodesNeedingLayout.length > 0 &&
				nodesNeedingLayout.length === flowData.nodes.length)
		) {
			// First time or all nodes are new - do full layout
			const { nodes: layoutedNodes, edges: layoutedEdges } =
				getLayoutedElements(flowData.nodes, flowData.edges, {
					direction: "TB",
				});

			// Apply any existing positions we might have
			finalNodes = layoutedNodes.map((node) => {
				const existingPos = existingPositions.get(node.id);
				if (existingPos) {
					return { ...node, position: existingPos };
				}
				return node;
			});

			hasInitialLayout.current = true;

			// Update edges with style
			const edgesWithStyle = layoutedEdges.map((edge) => ({
				...edge,
				data: {
					...edge.data,
					edgeStyle,
				},
			}));
			setFlowEdges(edgesWithStyle);
		} else if (nodesNeedingLayout.length > 0) {
			// Some nodes are new - layout only the new nodes
			// Use simple positioning for new nodes (find a free spot)
			const maxY =
				Math.max(...Array.from(existingPositions.values()).map((p) => p.y), 0) +
				400;

			finalNodes = flowData.nodes.map((node) => {
				const existingPos = existingPositions.get(node.id);
				if (existingPos) {
					return { ...node, position: existingPos };
				}
				// Position new nodes below existing ones
				const newIndex = nodesNeedingLayout.indexOf(node);
				const col = newIndex % 4;
				const row = Math.floor(newIndex / 4);
				return {
					...node,
					position: { x: col * 400, y: maxY + row * 400 },
				};
			});

			// Update edges with style
			const edgesWithStyle = flowData.edges.map((edge) => ({
				...edge,
				data: {
					...edge.data,
					edgeStyle,
				},
			}));
			setFlowEdges(edgesWithStyle);
		} else {
			// All nodes have positions - just filter and preserve positions
			finalNodes = flowData.nodes.map((node) => {
				const existingPos = existingPositions.get(node.id);
				return {
					...node,
					position: existingPos ?? node.position,
				};
			});

			// Update edges with style
			const edgesWithStyle = flowData.edges.map((edge) => ({
				...edge,
				data: {
					...edge.data,
					edgeStyle,
				},
			}));
			setFlowEdges(edgesWithStyle);
		}

		setFlowNodes(finalNodes);
	}, [flowData, edgeStyle, setFlowNodes, setFlowEdges, savedNodePositions]);

	// Save state to localStorage when hidden nodes, edge style, or node positions change
	useEffect(() => {
		// Don't save until we have nodes
		if (flowNodes.length === 0) return;

		savePersistedState({
			hiddenNodes: Array.from(hiddenNodes),
			edgeStyle,
			nodePositions: flowNodes.map((n) => ({
				id: n.id,
				x: n.position.x,
				y: n.position.y,
			})),
		});
		setHasCustomizedView(true);
	}, [hiddenNodes, edgeStyle, flowNodes]);

	// Compute connected nodes when hovering (from graph or filter panel)
	const activeHoveredId = hoveredNodeId ?? filterHoveredNodeId;
	const connectedNodeIds = useMemo(() => {
		if (!activeHoveredId) return null;
		const connected = new Set<string>([activeHoveredId]);
		for (const edge of flowEdges) {
			if (edge.source === activeHoveredId) {
				connected.add(edge.target);
			}
			if (edge.target === activeHoveredId) {
				connected.add(edge.source);
			}
		}
		return connected;
	}, [activeHoveredId, flowEdges]);

	// Get nodes connected to highlighted edge
	const highlightedEdgeNodes = useMemo(() => {
		if (!highlightedEdgeId) return null;
		const edge = flowEdges.find((e) => e.id === highlightedEdgeId);
		if (!edge) return null;
		return new Set([edge.source, edge.target]);
	}, [highlightedEdgeId, flowEdges]);

	// Apply dimmed styles to nodes not connected to hovered node or highlighted edge
	// Also add highlight ring when hovering from filter panel
	const styledNodes = useMemo(() => {
		if (!connectedNodeIds && !filterHoveredNodeId && !highlightedEdgeNodes)
			return flowNodes;
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
	}, [flowNodes, connectedNodeIds, filterHoveredNodeId, highlightedEdgeNodes]);

	// Apply dimmed styles to edges not connected to hovered node or highlighted edge
	const styledEdges = useMemo(() => {
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
	}, [flowEdges, activeHoveredId, highlightedEdgeId]);

	const selectedSchema = useMemo(() => {
		if (!selectedNodeKind) return null;
		// Search in nodes
		const node = data.nodes.find((n) => getSchemaKind(n) === selectedNodeKind);
		if (node) return node;
		// Search in profiles
		const profile = (data.profiles ?? []).find(
			(p) => getSchemaKind(p) === selectedNodeKind,
		);
		if (profile) return profile;
		// Search in templates
		const template = (data.templates ?? []).find(
			(t) => getSchemaKind(t) === selectedNodeKind,
		);
		if (template) return template;
		return null;
	}, [data.nodes, data.profiles, data.templates, selectedNodeKind]);

	const handleNodeMouseEnter = useCallback(
		(_: React.MouseEvent, node: Node) => {
			setHoveredNodeId(node.id);
		},
		[],
	);

	const handleNodeMouseLeave = useCallback(() => {
		setHoveredNodeId(null);
	}, []);

	const handleNodeContextMenu = useCallback(
		(event: React.MouseEvent, node: Node) => {
			event.preventDefault();
			setContextMenu({
				nodeId: node.id,
				x: event.clientX,
				y: event.clientY,
			});
		},
		[],
	);

	const handleCloseContextMenu = useCallback(() => {
		setContextMenu(null);
		setEdgeContextMenu(null);
		setHighlightedEdgeId(null);
	}, []);

	const handleEdgeContextMenu = useCallback(
		(event: React.MouseEvent, edge: Edge) => {
			event.preventDefault();
			const edgeData = edge.data as {
				sourceRelName?: string;
				targetRelName?: string | null;
			};
			// Determine cardinality from the animated property
			const cardinality: "one" | "many" = edge.animated ? "many" : "one";
			setEdgeContextMenu({
				edge: {
					id: edge.id,
					source: edge.source,
					target: edge.target,
					sourceRelName: edgeData?.sourceRelName ?? "",
					targetRelName: edgeData?.targetRelName ?? null,
					cardinality,
				},
				x: event.clientX,
				y: event.clientY,
			});
		},
		[],
	);

	const handleCloseEdgeContextMenu = useCallback(() => {
		setEdgeContextMenu(null);
	}, []);

	const handleHighlightEdge = useCallback((edgeId: string) => {
		setHighlightedEdgeId(edgeId);
	}, []);

	const handleSelectConnectedNodes = useCallback(
		(nodeId: string) => {
			// Find all connected node IDs
			const connectedIds = new Set<string>([nodeId]);
			for (const edge of flowEdges) {
				if (edge.source === nodeId) {
					connectedIds.add(edge.target);
				}
				if (edge.target === nodeId) {
					connectedIds.add(edge.source);
				}
			}

			// Update nodes to set selected state
			setFlowNodes((nodes) =>
				nodes.map((node) => ({
					...node,
					selected: connectedIds.has(node.id),
				})),
			);
		},
		[flowEdges, setFlowNodes],
	);

	const handleSelectSingleNode = useCallback(
		(nodeId: string) => {
			setFlowNodes((nodes) =>
				nodes.map((node) => ({
					...node,
					selected: node.id === nodeId,
				})),
			);
		},
		[setFlowNodes],
	);

	// Get all peer node kinds for a given schema kind (based on relationships)
	const getPeerKinds = useCallback(
		(nodeKind: string): Set<string> => {
			const peers = new Set<string>();

			// Helper to find peers from a schema's relationships
			const addPeersFromSchema = (
				schema: NodeSchema | ProfileSchema | TemplateSchema,
			) => {
				for (const rel of schema.relationships ?? []) {
					// Add direct peer
					peers.add(rel.peer);
					// If peer is a generic, also find nodes that inherit from it
					const generic = data.generics.find(
						(g) => getSchemaKind(g) === rel.peer,
					);
					if (generic) {
						// Find all nodes/templates that inherit from this generic
						for (const node of data.nodes) {
							if (node.inherit_from?.includes(rel.peer)) {
								peers.add(getSchemaKind(node));
							}
						}
						for (const template of data.templates ?? []) {
							if (template.inherit_from?.includes(rel.peer)) {
								peers.add(getSchemaKind(template));
							}
						}
					}
				}
			};

			// Search in nodes
			const node = data.nodes.find((n) => getSchemaKind(n) === nodeKind);
			if (node) {
				addPeersFromSchema(node);
			}

			// Search in profiles
			const profile = (data.profiles ?? []).find(
				(p) => getSchemaKind(p) === nodeKind,
			);
			if (profile) {
				addPeersFromSchema(profile);
			}

			// Search in templates
			const template = (data.templates ?? []).find(
				(t) => getSchemaKind(t) === nodeKind,
			);
			if (template) {
				addPeersFromSchema(template);
			}

			return peers;
		},
		[data.nodes, data.profiles, data.templates, data.generics],
	);

	const handleShowPeers = useCallback(
		(nodeId: string) => {
			const peerKinds = getPeerKinds(nodeId);

			setHiddenNodes((prev) => {
				const next = new Set(prev);
				// Unhide all peer nodes that are currently hidden
				for (const peerKind of peerKinds) {
					next.delete(peerKind);
				}
				return next;
			});
		},
		[getPeerKinds],
	);

	const handleHideNode = useCallback((nodeId: string) => {
		setHiddenNodes((prev) => {
			const next = new Set(prev);
			next.add(nodeId);
			return next;
		});
		// Clear selection if we're hiding the selected node
		setSelectedNodeKind((current) => (current === nodeId ? null : current));
	}, []);

	const handleNodeClick = useCallback(
		(_: React.MouseEvent, node: Node) => {
			setSelectedNodeKind(node.id);
			// Search in nodes first
			let schema = data.nodes.find((n) => getSchemaKind(n) === node.id);
			if (!schema) {
				// Search in profiles
				schema = (data.profiles ?? []).find(
					(p) => getSchemaKind(p) === node.id,
				) as NodeSchema | undefined;
			}
			if (!schema) {
				// Search in templates
				schema = (data.templates ?? []).find(
					(t) => getSchemaKind(t) === node.id,
				) as NodeSchema | undefined;
			}
			if (schema && onNodeClick) {
				onNodeClick(node.id, schema);
			}
		},
		[data.nodes, data.profiles, data.templates, onNodeClick],
	);

	const toggleNamespace = useCallback(
		(namespace: string) => {
			const nsSchemas = namespaceSchemas.get(namespace) ?? [];
			const schemaKinds = nsSchemas.map((item) => getSchemaKind(item.schema));
			const visibleCount = schemaKinds.filter(
				(k) => !hiddenNodes.has(k),
			).length;

			setHiddenNodes((prev) => {
				const next = new Set(prev);
				if (visibleCount > 0) {
					// Some or all are visible, hide all
					for (const kind of schemaKinds) {
						next.add(kind);
					}
				} else {
					// All are hidden, show all
					for (const kind of schemaKinds) {
						next.delete(kind);
					}
				}
				return next;
			});
		},
		[namespaceSchemas, hiddenNodes],
	);

	const toggleNode = useCallback((kind: string) => {
		setHiddenNodes((prev) => {
			const next = new Set(prev);
			if (next.has(kind)) {
				next.delete(kind);
			} else {
				next.add(kind);
			}
			return next;
		});
	}, []);

	const focusNode = useCallback(
		(kind: string) => {
			const node = getNode(kind);
			if (node) {
				setCenter(node.position.x + 150, node.position.y + 100, {
					zoom: 0.8,
					duration: 500,
				});
			}
		},
		[getNode, setCenter],
	);

	const handleLayout = useCallback(
		(direction: LayoutDirection) => {
			const { nodes: layoutedNodes, edges: layoutedEdges } =
				getLayoutedElements(flowNodes, flowEdges, { direction });

			// Add edge style to the layouted edges
			const edgesWithStyle = layoutedEdges.map((edge) => ({
				...edge,
				data: {
					...edge.data,
					edgeStyle,
				},
			}));

			setFlowNodes(layoutedNodes);
			setFlowEdges(edgesWithStyle);

			// Fit view after layout
			window.requestAnimationFrame(() => {
				fitView({ padding: 0.2 });
			});
		},
		[flowNodes, flowEdges, edgeStyle, setFlowNodes, setFlowEdges, fitView],
	);

	const handleExport = useCallback(
		(format: ExportFormat) => {
			const viewport = document.querySelector(
				".react-flow__viewport",
			) as HTMLElement;
			if (!viewport) return;

			// Calculate bounds to fit all nodes
			const nodesBounds = getNodesBounds(flowNodes);
			const padding = 50;
			const imageWidth = nodesBounds.width + padding * 2;
			const imageHeight = nodesBounds.height + padding * 2;

			// Get viewport transform to fit all nodes
			const viewportForBounds = getViewportForBounds(
				nodesBounds,
				imageWidth,
				imageHeight,
				0.5,
				2,
				0,
			);

			const exportOptions = {
				backgroundColor: "#f8fafc",
				width: imageWidth,
				height: imageHeight,
				style: {
					width: `${imageWidth}px`,
					height: `${imageHeight}px`,
					transform: `translate(${viewportForBounds.x}px, ${viewportForBounds.y}px) scale(${viewportForBounds.zoom})`,
				},
			};

			const downloadFile = (dataUrl: string, extension: string) => {
				const link = document.createElement("a");
				link.download = `schema-graph.${extension}`;
				link.href = dataUrl;
				link.click();
			};

			if (format === "png") {
				toPng(viewport, exportOptions).then((dataUrl) => {
					downloadFile(dataUrl, "png");
				});
			} else {
				toSvg(viewport, exportOptions).then((dataUrl) => {
					downloadFile(dataUrl, "svg");
				});
			}
		},
		[flowNodes],
	);

	return (
		<div className={cn("w-full h-full min-h-[500px] flex", className)}>
			<div className="relative flex-1">
				<ReactFlow
					nodes={styledNodes}
					edges={styledEdges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onNodeClick={handleNodeClick}
					onNodeContextMenu={handleNodeContextMenu}
					onNodeMouseEnter={handleNodeMouseEnter}
					onNodeMouseLeave={handleNodeMouseLeave}
					onEdgeContextMenu={handleEdgeContextMenu}
					onPaneClick={handleCloseContextMenu}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					connectionMode={ConnectionMode.Loose}
					fitView
					fitViewOptions={{ padding: 0.2 }}
					minZoom={0.1}
					maxZoom={1.5}
					defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
					proOptions={{ hideAttribution: true }}
					selectionOnDrag
					selectionMode={SelectionMode.Partial}
				>
					{showBackground && (
						<Background variant={BackgroundVariant.Dots} gap={20} size={1} />
					)}

					{/* Stats Panel */}
					{showStats && (
						<Panel
							position="top-left"
							className="rounded-lg bg-white p-3 shadow-md"
						>
							<div className="text-sm">
								<div className="mb-2 font-semibold text-gray-700">
									Schema Overview
								</div>
								<div className="space-y-1 text-gray-600">
									<div className="flex justify-between gap-4">
										<span>Visible:</span>
										<span className="font-medium">{visibleSchemasCount}</span>
									</div>
									<div className="flex justify-between gap-4">
										<span>Total:</span>
										<span className="font-medium">{totalSchemasCount}</span>
									</div>
									<div className="flex justify-between gap-4">
										<span>Nodes:</span>
										<span className="font-medium">{data.nodes.length}</span>
									</div>
									{(data.profiles?.length ?? 0) > 0 && (
										<div className="flex justify-between gap-4">
											<span>Profiles:</span>
											<span className="font-medium">
												{data.profiles?.length}
											</span>
										</div>
									)}
									{(data.templates?.length ?? 0) > 0 && (
										<div className="flex justify-between gap-4">
											<span>Templates:</span>
											<span className="font-medium">
												{data.templates?.length}
											</span>
										</div>
									)}
									<div className="flex justify-between gap-4">
										<span>Generics:</span>
										<span className="font-medium">{data.generics.length}</span>
									</div>
								</div>
							</div>
						</Panel>
					)}

					{/* Legend Panel */}
					<LegendPanel />

					{/* Bottom Toolbar */}
					{showToolbar && (
						<BottomToolbar
							onFilterClick={() => setIsFilterOpen(!isFilterOpen)}
							isFilterOpen={isFilterOpen}
							edgeStyle={edgeStyle}
							onEdgeStyleChange={setEdgeStyle}
							onLayout={handleLayout}
							onExport={handleExport}
							onReset={handleResetView}
							showReset={hasCustomizedView}
						/>
					)}
				</ReactFlow>
			</div>

			{/* Filter Panel */}
			{isFilterOpen && (
				<FilterPanel
					namespaceSchemas={namespaceSchemas}
					hiddenNodes={hiddenNodes}
					onToggleNamespace={toggleNamespace}
					onToggleNode={toggleNode}
					onFocusNode={focusNode}
					onClose={() => setIsFilterOpen(false)}
					onHoverNode={setFilterHoveredNodeId}
				/>
			)}

			{/* Node Details Panel */}
			{showNodeDetails && selectedSchema && !isFilterOpen && (
				<NodeDetailsPanel
					schema={selectedSchema}
					onClose={() => setSelectedNodeKind(null)}
				/>
			)}

			{/* Node Context Menu */}
			{contextMenu && (
				<NodeContextMenu
					nodeId={contextMenu.nodeId}
					x={contextMenu.x}
					y={contextMenu.y}
					onClose={handleCloseContextMenu}
					onSelectConnected={handleSelectConnectedNodes}
					onSelectNode={handleSelectSingleNode}
					onShowPeers={handleShowPeers}
					onHideNode={handleHideNode}
				/>
			)}

			{/* Edge Context Menu */}
			{edgeContextMenu && (
				<EdgeContextMenu
					edge={edgeContextMenu.edge}
					x={edgeContextMenu.x}
					y={edgeContextMenu.y}
					onClose={handleCloseEdgeContextMenu}
					onHighlight={handleHighlightEdge}
				/>
			)}
		</div>
	);
}

export function SchemaVisualizer(props: SchemaVisualizerProps) {
	return (
		<ReactFlowProvider>
			<SchemaVisualizerInner {...props} />
		</ReactFlowProvider>
	);
}
