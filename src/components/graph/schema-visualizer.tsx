import {
	Background,
	BackgroundVariant,
	ConnectionMode,
	type Edge,
	type EdgeTypes,
	type Node,
	type NodeTypes,
	ReactFlow,
	ReactFlowProvider,
	SelectionMode,
	useReactFlow,
	type Viewport,
} from "@xyflow/react";
import { useAtom } from "jotai";
import { useCallback, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";

import { exportGraph } from "../../hooks/use-export";
import { useGraphLayout } from "../../hooks/use-graph-layout";
import {
	getConnectedNodeIds,
	getHighlightedEdgeNodes,
	getStyledEdges,
	getStyledNodes,
} from "../../hooks/use-node-highlighting";
import {
	countTotalSchemas,
	countVisibleSchemas,
	findSchemaByKind,
	getPeerKinds,
	groupSchemasByNamespace,
} from "../../hooks/use-schema-data";
import { viewportAtom } from "../../store/visualizer-atoms";
import type {
	GenericSchema,
	NodeSchema,
	ProfileSchema,
	SchemaVisualizerData,
	TemplateSchema,
} from "../../types/schema";
import { cn } from "../../utils/cn";
import { getSchemaKind } from "../../utils/schema-to-flow";
import { EdgeContextMenu, type EdgeInfo } from "../menus/edge-context-menu";
import { NodeContextMenu } from "../menus/node-context-menu";
import { FilterPanel } from "../panels/filter-panel";
import { LegendPanel } from "../panels/legend-panel";
import { NodeDetailsPanel } from "../panels/node-details-panel";
import { StatsPanel } from "../panels/stats-panel";
import {
	BottomToolbar,
	type ExportFormat,
	type LayoutDirection,
} from "../toolbar/bottom-toolbar";
import { FloatingEdge } from "./floating-edge";
import { SchemaNode } from "./schema-node";

const nodeTypes: NodeTypes = {
	schemaNode: SchemaNode,
};

const edgeTypes: EdgeTypes = {
	floating: FloatingEdge,
};

export interface SchemaVisualizerProps {
	data: SchemaVisualizerData;
	className?: string;
	showBackground?: boolean;
	rowSize?: number;
	nodeSpacing?: number;
	onNodeClick?: (
		nodeId: string,
		schema: NodeSchema | GenericSchema | ProfileSchema | TemplateSchema,
	) => void;
	defaultFilterOpen?: boolean;
	showNodeDetails?: boolean;
	showToolbar?: boolean;
	showStats?: boolean;
}

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
	const { setCenter, getNode, getNodes, fitView } = useReactFlow();
	const [savedViewport, setSavedViewport] = useAtom(viewportAtom);

	const hasSavedViewport = savedViewport !== null;

	const viewportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const handleViewportChange = useCallback(
		(viewport: Viewport) => {
			if (viewportTimerRef.current) clearTimeout(viewportTimerRef.current);
			viewportTimerRef.current = setTimeout(() => {
				setSavedViewport(viewport);
			}, 300);
		},
		[setSavedViewport],
	);

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

	// Graph layout and state (backed by Jotai atoms)
	const {
		flowNodes,
		flowEdges,
		setFlowNodes,
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
	} = useGraphLayout(data, { nodeSpacing, rowSize }, fitView);

	// Derived data
	const namespaceSchemas = groupSchemasByNamespace(data);
	const visibleSchemasCount = countVisibleSchemas(data, hiddenNodes);
	const totalSchemasCount = countTotalSchemas(data);
	const selectedSchema = selectedNodeKind
		? findSchemaByKind(data, selectedNodeKind)
		: null;

	// Highlighting
	const activeHoveredId = hoveredNodeId ?? filterHoveredNodeId;
	const connectedNodeIds = getConnectedNodeIds(activeHoveredId, flowEdges);
	const highlightedEdgeNodes = getHighlightedEdgeNodes(
		highlightedEdgeId,
		flowEdges,
	);
	const styledNodes = getStyledNodes(
		flowNodes,
		connectedNodeIds,
		filterHoveredNodeId,
		highlightedEdgeNodes,
	);
	const styledEdges = getStyledEdges(
		flowEdges,
		activeHoveredId,
		highlightedEdgeId,
	);

	// Event handlers
	const handleNodeMouseEnter = (_: React.MouseEvent, node: Node) => {
		setHoveredNodeId(node.id);
	};

	const handleNodeMouseLeave = () => {
		setHoveredNodeId(null);
	};

	const handleNodeContextMenu = (event: React.MouseEvent, node: Node) => {
		event.preventDefault();
		setContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
	};

	const handleCloseContextMenu = () => {
		setContextMenu(null);
		setEdgeContextMenu(null);
		setHighlightedEdgeId(null);
	};

	const handleEdgeContextMenu = (event: React.MouseEvent, edge: Edge) => {
		event.preventDefault();
		const edgeData = edge.data as {
			sourceRelName?: string;
			targetRelName?: string | null;
		};
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
	};

	const handleSelectConnectedNodes = (nodeId: string) => {
		const connectedIds = new Set<string>([nodeId]);
		for (const edge of flowEdges) {
			if (edge.source === nodeId) connectedIds.add(edge.target);
			if (edge.target === nodeId) connectedIds.add(edge.source);
		}
		setFlowNodes((nodes) =>
			nodes.map((node) => ({ ...node, selected: connectedIds.has(node.id) })),
		);
	};

	const handleSelectSingleNode = (nodeId: string) => {
		setFlowNodes((nodes) =>
			nodes.map((node) => ({ ...node, selected: node.id === nodeId })),
		);
	};

	const handleShowPeers = (nodeId: string) => {
		const peerKinds = getPeerKinds(nodeId, data);
		const next = new Set(hiddenNodes);
		for (const peerKind of peerKinds) {
			next.delete(peerKind);
		}
		setHiddenNodes(next);
	};

	const handleHideNode = (nodeId: string) => {
		const next = new Set(hiddenNodes);
		next.add(nodeId);
		setHiddenNodes(next);
		setSelectedNodeKind((current) => (current === nodeId ? null : current));
	};

	const handleNodeClick = (_: React.MouseEvent, node: Node) => {
		const schema = findSchemaByKind(data, node.id);
		if (schema && onNodeClick) {
			onNodeClick(node.id, schema);
		}
	};

	const handleShowDetails = (nodeId: string) => {
		setSelectedNodeKind(nodeId);
	};

	const toggleNamespace = (namespace: string) => {
		const nsSchemas = namespaceSchemas.get(namespace) ?? [];
		const schemaKinds = nsSchemas.map((item) => getSchemaKind(item.schema));
		const visibleCount = schemaKinds.filter((k) => !hiddenNodes.has(k)).length;

		const next = new Set(hiddenNodes);
		if (visibleCount > 0) {
			for (const kind of schemaKinds) next.add(kind);
		} else {
			for (const kind of schemaKinds) next.delete(kind);
		}
		setHiddenNodes(next);
	};

	const toggleNode = (kind: string) => {
		const next = new Set(hiddenNodes);
		if (next.has(kind)) {
			next.delete(kind);
		} else {
			next.add(kind);
		}
		setHiddenNodes(next);
	};

	const focusNode = (kind: string) => {
		const node = getNode(kind);
		if (node) {
			setCenter(node.position.x + 150, node.position.y + 100, {
				zoom: 0.8,
				duration: 500,
			});
		}
	};

	const handleResetViewWithViewport = () => {
		setSavedViewport(null);
		handleResetView();
	};

	const onLayout = (direction: LayoutDirection) => {
		handleLayout(direction, flowNodes, flowEdges);
	};

	const handleExport = (format: ExportFormat) => {
		exportGraph(flowNodes, format);
	};

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
					onNodeDragStop={() => persistPositions(getNodes())}
					onEdgeContextMenu={handleEdgeContextMenu}
					onPaneClick={handleCloseContextMenu}
					onViewportChange={handleViewportChange}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					connectionMode={ConnectionMode.Loose}
					fitView={!hasSavedViewport}
					fitViewOptions={{ padding: 0.2 }}
					minZoom={0.1}
					maxZoom={1.5}
					defaultViewport={savedViewport ?? { x: 0, y: 0, zoom: 0.5 }}
					proOptions={{ hideAttribution: true }}
					selectionOnDrag
					selectionMode={SelectionMode.Partial}
				>
					{showBackground && (
						<Background variant={BackgroundVariant.Dots} gap={20} size={1} />
					)}

					{showStats && (
						<StatsPanel
							data={data}
							visibleCount={visibleSchemasCount}
							totalCount={totalSchemasCount}
						/>
					)}

					<LegendPanel />

					{showToolbar && (
						<BottomToolbar
							onFilterClick={() => setIsFilterOpen(!isFilterOpen)}
							isFilterOpen={isFilterOpen}
							edgeStyle={edgeStyle}
							onEdgeStyleChange={setEdgeStyle}
							onLayout={onLayout}
							onExport={handleExport}
							onReset={handleResetViewWithViewport}
							showReset={hasCustomizedView}
						/>
					)}
				</ReactFlow>
			</div>

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

			{showNodeDetails && selectedSchema && !isFilterOpen && (
				<NodeDetailsPanel
					schema={selectedSchema}
					onClose={() => setSelectedNodeKind(null)}
				/>
			)}

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
					onShowDetails={handleShowDetails}
				/>
			)}

			{edgeContextMenu && (
				<EdgeContextMenu
					edge={edgeContextMenu.edge}
					x={edgeContextMenu.x}
					y={edgeContextMenu.y}
					onClose={() => setEdgeContextMenu(null)}
					onHighlight={setHighlightedEdgeId}
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
