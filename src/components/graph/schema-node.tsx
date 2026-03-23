import { Icon } from "@iconify-icon/react";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { useAtom } from "jotai";
import { collapsedNodesSetAtom } from "../../store/visualizer-atoms";
import type { SchemaType } from "../../types/schema";
import { cn } from "../../utils/cn";
import type { SchemaNodeData } from "../../utils/schema-to-flow";

const SCHEMA_TYPE_CONFIG: Record<
	SchemaType,
	{
		selectedBorder: string;
		accentBorder: string;
		iconBg: string;
		icon: string;
		label: string | null;
	}
> = {
	profile: {
		selectedBorder: "border-[#7F22FE]",
		accentBorder: "border-t-[#7F22FE]",
		iconBg: "bg-[#7F22FE]",
		icon: "mdi:tune-variant",
		label: "Profile",
	},
	template: {
		selectedBorder: "border-[#F54900]",
		accentBorder: "border-t-[#F54900]",
		iconBg: "bg-[#F54900]",
		icon: "mdi:file-document-outline",
		label: "Template",
	},
	generic: {
		selectedBorder: "border-[#009966]",
		accentBorder: "border-t-[#009966]",
		iconBg: "bg-[#009966]",
		icon: "mdi:shape-outline",
		label: "Generic",
	},
	node: {
		selectedBorder: "border-[#087895]",
		accentBorder: "border-t-[#087895]",
		iconBg: "bg-[#087895]",
		icon: "mdi:cube-outline",
		label: null,
	},
};

const HANDLE_STYLE_LEFT = {
	left: -2,
	width: 4,
	height: 4,
	background: "transparent",
	border: "none",
} as const;

const HANDLE_STYLE_RIGHT = {
	right: -2,
	width: 4,
	height: 4,
	background: "transparent",
	border: "none",
} as const;

function RelationshipHandles({ name }: { name: string }) {
	return (
		<>
			<Handle
				type="source"
				position={Position.Left}
				id={`rel-${name}-left`}
				style={HANDLE_STYLE_LEFT}
			/>
			<Handle
				type="source"
				position={Position.Right}
				id={`rel-${name}-right`}
				style={HANDLE_STYLE_RIGHT}
			/>
		</>
	);
}

function SectionHeader({
	label,
	count,
}: { label: string; count: number }) {
	return (
		<div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
			<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
				{label} ({count})
			</h4>
		</div>
	);
}

function InheritedBadge() {
	return <span className="text-[10px] text-gray-400">(inherited)</span>;
}

function AttributeRow({
	attr,
}: {
	attr: SchemaNodeData["attributes"][number];
}) {
	return (
		<div
			className={cn(
				"px-3 py-1.5 flex items-center justify-between text-xs border-b border-gray-50 last:border-0",
				attr.inherited && "bg-gray-50/50",
			)}
		>
			<div className="flex items-center gap-2 min-w-0 flex-1">
				<span
					className={cn(
						"font-medium truncate",
						attr.inherited ? "text-gray-400" : "text-gray-700",
					)}
				>
					{attr.name}
					{attr.optional && <span className="text-gray-400 ml-0.5">?</span>}
				</span>
				{attr.inherited && <InheritedBadge />}
			</div>
			<span className="text-gray-400 text-[10px] uppercase ml-2 shrink-0">
				{attr.kind}
			</span>
		</div>
	);
}

function RelationshipRow({
	rel,
	selfKind,
}: {
	rel: SchemaNodeData["relationships"][number];
	selfKind: string;
}) {
	const isSelfRef = rel.peer === selfKind;

	return (
		<div
			className={cn(
				"px-3 py-1.5 flex items-center justify-between text-xs border-b border-gray-50 last:border-0 relative group/rel",
				rel.inherited && "bg-gray-50/50",
			)}
		>
			<RelationshipHandles name={rel.name} />
			<div className="flex items-center gap-2 min-w-0 flex-1">
				<span
					className={cn(
						"font-medium truncate",
						rel.inherited ? "text-gray-400" : "text-gray-700",
					)}
				>
					{rel.name}
				</span>
				{rel.inherited && <InheritedBadge />}
			</div>
			<div className="flex items-center gap-1 ml-2 shrink-0">
				<span
					className={cn(
						"px-1.5 py-0.5 rounded text-[10px]",
						rel.cardinality === "many"
							? "bg-purple-100 text-purple-700"
							: "bg-blue-100 text-blue-700",
					)}
				>
					{rel.cardinality}
				</span>
				{isSelfRef ? (
					<span
						className="text-[10px] text-orange-500 flex items-center gap-0.5"
						title="Self-referencing relationship"
					>
						<Icon icon="mdi:reload" className="text-sm" />
						self
					</span>
				) : (
					<span className="text-gray-400 text-[10px] truncate max-w-[80px]">
						→ {rel.peer}
					</span>
				)}
			</div>
		</div>
	);
}

function AttributesSection({
	attributes,
}: { attributes: SchemaNodeData["attributes"] }) {
	if (attributes.length === 0) return null;

	return (
		<div className="border-b border-gray-100">
			<SectionHeader label="Attributes" count={attributes.length} />
			<div className="max-h-[150px] overflow-y-auto">
				{attributes.map((attr) => (
					<AttributeRow key={attr.name} attr={attr} />
				))}
			</div>
		</div>
	);
}

function RelationshipsSection({
	relationships,
	selfKind,
}: {
	relationships: SchemaNodeData["relationships"];
	selfKind: string;
}) {
	if (relationships.length === 0) return null;

	return (
		<div>
			<SectionHeader label="Relationships" count={relationships.length} />
			<div>
				{relationships.map((rel) => (
					<RelationshipRow key={rel.name} rel={rel} selfKind={selfKind} />
				))}
			</div>
		</div>
	);
}

function CollapsedHandles({
	relationships,
}: { relationships: SchemaNodeData["relationships"] }) {
	return (
		<>
			{relationships.map((rel) => (
				<span key={rel.name} className="relative">
					<RelationshipHandles name={rel.name} />
				</span>
			))}
		</>
	);
}

function NodeHeader({
	nodeData,
	config,
	collapsed,
	hasContent,
	onToggle,
}: {
	nodeData: SchemaNodeData;
	config: (typeof SCHEMA_TYPE_CONFIG)[SchemaType];
	collapsed: boolean;
	hasContent: boolean;
	onToggle: () => void;
}) {
	const hasInheritance =
		nodeData.inheritFrom && nodeData.inheritFrom.length > 0;

	return (
		<button
			type="button"
			className={cn(
				"bg-gray-100 px-4 py-3 border-t-4 select-none w-full text-left",
				config.accentBorder,
				hasContent ? "cursor-pointer" : "cursor-default",
				collapsed || !hasContent ? "rounded-md" : "rounded-t-md",
			)}
			onClick={hasContent ? onToggle : undefined}
		>
			<div className="flex items-center gap-2">
				<div
					className={cn(
						"w-8 h-8 rounded-md flex items-center justify-center shrink-0",
						config.iconBg,
					)}
				>
					<Icon
						icon={nodeData.icon || config.icon}
						width="20"
						height="20"
						className="text-white"
					/>
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<h3 className="font-semibold text-sm truncate text-gray-900">
							{nodeData.label}
						</h3>
						{config.label && (
							<span className="px-1.5 py-0.5 text-[10px] bg-gray-300/50 text-gray-600 rounded">
								{config.label}
							</span>
						)}
					</div>
					<p className="text-xs text-gray-500 truncate">{nodeData.kind}</p>
				</div>
				{hasContent && (
					<Icon
						icon={collapsed ? "mdi:chevron-down" : "mdi:chevron-up"}
						width="18"
						height="18"
						className="text-gray-400 shrink-0"
					/>
				)}
			</div>
			{hasInheritance && (
				<div className="mt-2 flex flex-wrap gap-1">
					{nodeData.inheritFrom?.map((generic) => (
						<span
							key={generic}
							className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600"
						>
							↑ {generic}
						</span>
					))}
				</div>
			)}
		</button>
	);
}

export function SchemaNode({ data, selected }: NodeProps) {
	const nodeData = data as SchemaNodeData;
	const [collapsedNodes, setCollapsedNodes] = useAtom(collapsedNodesSetAtom);
	const collapsed = collapsedNodes.has(nodeData.kind);
	const schemaType = nodeData.schemaType ?? "node";
	const config = SCHEMA_TYPE_CONFIG[schemaType];
	const hasContent =
		nodeData.attributes.length > 0 || nodeData.relationships.length > 0;

	const toggleCollapsed = () => {
		const next = new Set(collapsedNodes);
		if (next.has(nodeData.kind)) {
			next.delete(nodeData.kind);
		} else {
			next.add(nodeData.kind);
		}
		setCollapsedNodes(next);
	};

	return (
		<div
			className={cn(
				"bg-white rounded-lg shadow-lg border-2 min-w-[280px] max-w-[320px]",
				"transition-all duration-200",
				selected ? config.selectedBorder : "border-gray-200",
				selected && "shadow-xl",
				"hover:shadow-xl",
			)}
		>
			<NodeHeader
				nodeData={nodeData}
				config={config}
				collapsed={collapsed}
				hasContent={hasContent}
				onToggle={toggleCollapsed}
			/>

			{collapsed && (
				<CollapsedHandles relationships={nodeData.relationships} />
			)}

			{!collapsed && hasContent && (
				<>
					<AttributesSection attributes={nodeData.attributes} />
					<RelationshipsSection
						relationships={nodeData.relationships}
						selfKind={nodeData.kind}
					/>
				</>
			)}
		</div>
	);
}
