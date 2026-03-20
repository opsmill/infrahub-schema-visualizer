import { Icon } from "@iconify-icon/react";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { cn } from "../../utils/cn";
import type { SchemaNodeData } from "../../utils/schema-to-flow";

// Get header colors based on schema type
const getHeaderColors = (
	schemaType: "node" | "generic" | "profile" | "template",
) => {
	switch (schemaType) {
		case "profile":
			return "from-pink-500 to-pink-600";
		case "template":
			return "from-amber-500 to-amber-600";
		case "generic":
			return "from-emerald-500 to-emerald-600";
		default:
			return "from-indigo-500 to-indigo-600";
	}
};

// Get border color based on schema type
const getBorderColor = (
	schemaType: "node" | "generic" | "profile" | "template",
	selected: boolean,
) => {
	if (selected) {
		switch (schemaType) {
			case "profile":
				return "border-pink-500";
			case "template":
				return "border-amber-500";
			case "generic":
				return "border-emerald-500";
			default:
				return "border-indigo-500";
		}
	}
	return "border-gray-200";
};

// Get schema type label
const getSchemaTypeLabel = (
	schemaType: "node" | "generic" | "profile" | "template",
) => {
	switch (schemaType) {
		case "profile":
			return "Profile";
		case "template":
			return "Template";
		case "generic":
			return "Generic";
		default:
			return null;
	}
};

export function SchemaNode({ data, selected }: NodeProps) {
	const nodeData = data as SchemaNodeData;
	const hasInheritance =
		nodeData.inheritFrom && nodeData.inheritFrom.length > 0;
	const schemaType = nodeData.schemaType ?? "node";
	const typeLabel = getSchemaTypeLabel(schemaType);

	return (
		<div
			className={cn(
				"bg-white rounded-lg shadow-lg border-2 min-w-[280px] max-w-[320px]",
				"transition-all duration-200",
				getBorderColor(schemaType, selected ?? false),
				selected && "shadow-xl",
				"hover:shadow-xl",
			)}
		>
			{/* Header */}
			<div
				className={cn(
					"bg-gradient-to-r text-white px-4 py-3 rounded-t-md",
					getHeaderColors(schemaType),
				)}
			>
				<div className="flex items-center gap-2">
					{nodeData.icon && (
						<Icon icon={nodeData.icon} className="text-2xl opacity-90" />
					)}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold text-sm truncate">
								{nodeData.label}
							</h3>
							{typeLabel && (
								<span className="px-1.5 py-0.5 text-[10px] bg-white/20 rounded">
									{typeLabel}
								</span>
							)}
						</div>
						<p className="text-xs opacity-70 truncate">{nodeData.kind}</p>
					</div>
				</div>
				{hasInheritance && (
					<div className="mt-2 flex flex-wrap gap-1">
						{nodeData.inheritFrom?.map((generic) => (
							<span
								key={generic}
								className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-indigo-400/30 text-indigo-100"
							>
								↑ {generic}
							</span>
						))}
					</div>
				)}
			</div>

			{/* Attributes Section */}
			{nodeData.attributes.length > 0 && (
				<div className="border-b border-gray-100">
					<div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
						<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
							Attributes ({nodeData.attributes.length})
						</h4>
					</div>
					<div className="max-h-[150px] overflow-y-auto">
						{nodeData.attributes.map((attr) => (
							<div
								key={attr.name}
								className={cn(
									"px-3 py-1.5 flex items-center justify-between text-xs border-b border-gray-50 last:border-0",
									attr.inherited ? "bg-gray-50/50" : "",
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
										{attr.optional && (
											<span className="text-gray-400 ml-0.5">?</span>
										)}
									</span>
									{attr.inherited && (
										<span className="text-[10px] text-gray-400">
											(inherited)
										</span>
									)}
								</div>
								<span className="text-gray-400 text-[10px] uppercase ml-2 shrink-0">
									{attr.kind}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Relationships Section */}
			{nodeData.relationships.length > 0 && (
				<div>
					<div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
						<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
							Relationships ({nodeData.relationships.length})
						</h4>
					</div>
					<div>
						{nodeData.relationships.map((rel) => (
							<div
								key={rel.name}
								className={cn(
									"px-3 py-1.5 flex items-center justify-between text-xs border-b border-gray-50 last:border-0 relative group/rel",
									rel.inherited ? "bg-gray-50/50" : "",
								)}
							>
								{/* Left handle - invisible but functional */}
								<Handle
									type="source"
									position={Position.Left}
									id={`rel-${rel.name}-left`}
									style={{
										left: -2,
										width: 4,
										height: 4,
										background: "transparent",
										border: "none",
									}}
								/>
								<div className="flex items-center gap-2 min-w-0 flex-1">
									<span
										className={cn(
											"font-medium truncate",
											rel.inherited ? "text-gray-400" : "text-gray-700",
										)}
									>
										{rel.name}
									</span>
									{rel.inherited && (
										<span className="text-[10px] text-gray-400">
											(inherited)
										</span>
									)}
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
									{rel.peer === nodeData.kind ? (
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
								{/* Right handle - invisible but functional */}
								<Handle
									type="source"
									position={Position.Right}
									id={`rel-${rel.name}-right`}
									style={{
										right: -2,
										width: 4,
										height: 4,
										background: "transparent",
										border: "none",
									}}
								/>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Empty state */}
			{nodeData.attributes.length === 0 &&
				nodeData.relationships.length === 0 && (
					<div className="px-4 py-6 text-center text-gray-400 text-sm">
						No attributes or relationships
					</div>
				)}
		</div>
	);
}
