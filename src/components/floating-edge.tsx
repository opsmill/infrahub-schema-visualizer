import {
	BaseEdge,
	type EdgeProps,
	getBezierPath,
	getSmoothStepPath,
	Position,
	useInternalNode,
} from "@xyflow/react";

export type EdgeStyle = "bezier" | "smoothstep";

type NodeType = NonNullable<ReturnType<typeof useInternalNode>>;

// Get handle position by ID from a node
function getHandlePosition(
	node: NodeType,
	handleId: string,
): { x: number; y: number; position: Position } | null {
	// Check both source and target handle bounds
	const sourceHandle = node.internals.handleBounds?.source?.find(
		(h) => h.id === handleId,
	);
	const targetHandle = node.internals.handleBounds?.target?.find(
		(h) => h.id === handleId,
	);
	const handle = sourceHandle ?? targetHandle;

	if (!handle) return null;

	return {
		x: node.internals.positionAbsolute.x + handle.x + handle.width / 2,
		y: node.internals.positionAbsolute.y + handle.y + handle.height / 2,
		position: handle.position,
	};
}

// Get the best handles to use based on node positions
function getClosestHandles(
	sourceNode: NodeType,
	targetNode: NodeType,
	sourceRelName: string,
	targetRelName: string | null,
): {
	sx: number;
	sy: number;
	tx: number;
	ty: number;
	sourcePos: Position;
	targetPos: Position;
} {
	// Get source handles (left and right for the relationship)
	const sourceLeftHandle = getHandlePosition(
		sourceNode,
		`rel-${sourceRelName}-left`,
	);
	const sourceRightHandle = getHandlePosition(
		sourceNode,
		`rel-${sourceRelName}-right`,
	);

	// Get target handles - either relationship-specific or fallback to node center
	let targetLeftHandle: { x: number; y: number; position: Position } | null =
		null;
	let targetRightHandle: { x: number; y: number; position: Position } | null =
		null;

	if (targetRelName) {
		targetLeftHandle = getHandlePosition(
			targetNode,
			`rel-${targetRelName}-left`,
		);
		targetRightHandle = getHandlePosition(
			targetNode,
			`rel-${targetRelName}-right`,
		);
	}

	// If no target handles found, use node top (for edges to generic/node without matching relationship)
	if (!targetLeftHandle || !targetRightHandle) {
		const targetWidth = targetNode.measured?.width ?? 280;
		// Use top of the node header area (approximately 40px from top)
		const targetTopY = targetNode.internals.positionAbsolute.y + 20;

		targetLeftHandle = {
			x: targetNode.internals.positionAbsolute.x,
			y: targetTopY,
			position: Position.Left,
		};
		targetRightHandle = {
			x: targetNode.internals.positionAbsolute.x + targetWidth,
			y: targetTopY,
			position: Position.Right,
		};
	}

	// If no source handles, use node center edges
	if (!sourceLeftHandle || !sourceRightHandle) {
		const sourceWidth = sourceNode.measured?.width ?? 280;
		const sourceHeight = sourceNode.measured?.height ?? 200;
		const sourceCenterY =
			sourceNode.internals.positionAbsolute.y + sourceHeight / 2;

		// Determine which side based on relative position
		const sourceX = sourceNode.internals.positionAbsolute.x;
		const targetX = targetNode.internals.positionAbsolute.x;
		const useRightSide = targetX > sourceX;

		return {
			sx: useRightSide ? sourceX + sourceWidth : sourceX,
			sy: sourceCenterY,
			tx: useRightSide ? targetLeftHandle.x : targetRightHandle.x,
			ty: useRightSide ? targetLeftHandle.y : targetRightHandle.y,
			sourcePos: useRightSide ? Position.Right : Position.Left,
			targetPos: useRightSide ? Position.Left : Position.Right,
		};
	}

	// Calculate distances for all combinations to find the shortest path
	const combinations = [
		{
			source: sourceLeftHandle,
			target: targetRightHandle,
			sourcePos: Position.Left,
			targetPos: Position.Right,
		},
		{
			source: sourceLeftHandle,
			target: targetLeftHandle,
			sourcePos: Position.Left,
			targetPos: Position.Left,
		},
		{
			source: sourceRightHandle,
			target: targetLeftHandle,
			sourcePos: Position.Right,
			targetPos: Position.Left,
		},
		{
			source: sourceRightHandle,
			target: targetRightHandle,
			sourcePos: Position.Right,
			targetPos: Position.Right,
		},
	];

	let bestCombo = combinations[0];
	let shortestDistance = Number.POSITIVE_INFINITY;

	for (const combo of combinations) {
		const dx = combo.target.x - combo.source.x;
		const dy = combo.target.y - combo.source.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance < shortestDistance) {
			shortestDistance = distance;
			bestCombo = combo;
		}
	}

	return {
		sx: bestCombo.source.x,
		sy: bestCombo.source.y,
		tx: bestCombo.target.x,
		ty: bestCombo.target.y,
		sourcePos: bestCombo.sourcePos,
		targetPos: bestCombo.targetPos,
	};
}

export function FloatingEdge({
	id,
	source,
	target,
	style,
	animated,
	data,
}: EdgeProps) {
	const sourceNode = useInternalNode(source);
	const targetNode = useInternalNode(target);

	if (!sourceNode || !targetNode) {
		return null;
	}

	// Self-loop edges are not rendered - show a marker on the node instead
	if (source === target) {
		return null;
	}

	// Get relationship names and edge style from edge data
	const edgeData = data as {
		sourceRelName?: string;
		targetRelName?: string | null;
		edgeStyle?: EdgeStyle;
	};
	const sourceRelName = edgeData?.sourceRelName ?? "";
	const targetRelName = edgeData?.targetRelName ?? null;
	const edgeStyle = edgeData?.edgeStyle ?? "bezier";

	const { sx, sy, tx, ty, sourcePos, targetPos } = getClosestHandles(
		sourceNode,
		targetNode,
		sourceRelName,
		targetRelName,
	);

	const pathParams = {
		sourceX: sx,
		sourceY: sy,
		sourcePosition: sourcePos,
		targetX: tx,
		targetY: ty,
		targetPosition: targetPos,
	};

	const [edgePath] =
		edgeStyle === "smoothstep"
			? getSmoothStepPath(pathParams)
			: getBezierPath(pathParams);

	return (
		<BaseEdge
			id={id}
			path={edgePath}
			style={style}
			className={
				animated ? "react-flow__edge-path animated" : "react-flow__edge-path"
			}
		/>
	);
}
