import { Icon } from "@iconify-icon/react";
import type {
	GenericSchema,
	NodeSchema,
	ProfileSchema,
	TemplateSchema,
} from "../../types/schema";
import { cn } from "../../utils/cn";

export interface NodeDetailsPanelProps {
	schema: NodeSchema | GenericSchema | ProfileSchema | TemplateSchema | null;
	onClose: () => void;
}

function PropertyRow({
	label,
	value,
}: {
	label: string;
	value?: string | null;
}) {
	if (!value) return null;
	return (
		<div className="flex justify-between gap-2">
			<span className="text-(--sv-text-4)">{label}</span>
			<span className="text-right font-medium text-(--sv-text-2)">{value}</span>
		</div>
	);
}

function Badge({
	children,
	variant = "gray",
}: {
	children: React.ReactNode;
	variant?: "gray" | "blue" | "yellow" | "red";
}) {
	const variantClasses = {
		gray: "bg-(--sv-surface-3) text-(--sv-text-3)",
		blue: "bg-(--sv-badge-blue-bg) text-(--sv-badge-blue-text)",
		yellow: "bg-(--sv-badge-yellow-bg) text-(--sv-badge-yellow-text)",
		red: "bg-(--sv-badge-red-bg) text-(--sv-badge-red-text)",
	};

	return (
		<span
			className={cn("px-1.5 py-0.5 rounded text-xs", variantClasses[variant])}
		>
			{children}
		</span>
	);
}

export function NodeDetailsPanel({ schema, onClose }: NodeDetailsPanelProps) {
	if (!schema) return null;

	return (
		<div className="flex h-full w-96 flex-col border-(--sv-border) border-l bg-(--sv-surface)">
			<div className="flex items-center justify-between border-(--sv-border) border-b px-4 py-3">
				<div className="flex items-center gap-2">
					{schema.icon && (
						<Icon
							icon={schema.icon}
							className="text-(--sv-accent-text) text-xl"
						/>
					)}
					<div>
						<h3 className="font-semibold text-(--sv-text-2)">
							{schema.label ?? schema.name}
						</h3>
						<p className="text-(--sv-text-4) text-xs">{schema.kind}</p>
					</div>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="p-1 rounded hover:bg-(--sv-surface-3) text-(--sv-text-4)"
				>
					<Icon icon="mdi:close" className="text-lg" />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto">
				{/* Properties */}
				<div className="border-(--sv-border-2) border-b p-4">
					<h4 className="mb-2 font-semibold text-(--sv-text-3) text-xs uppercase tracking-wide">
						Properties
					</h4>
					<div className="space-y-2 text-sm">
						<PropertyRow label="Namespace" value={schema.namespace} />
						<PropertyRow label="Name" value={schema.name} />
						<PropertyRow label="Kind" value={schema.kind} />
						{schema.description && (
							<PropertyRow label="Description" value={schema.description} />
						)}
						{"inherit_from" in schema &&
							schema.inherit_from &&
							schema.inherit_from.length > 0 && (
								<div className="flex justify-between">
									<span className="text-(--sv-text-4)">Inherit from</span>
									<div className="flex flex-wrap justify-end gap-1">
										{schema.inherit_from.map((k: string) => (
											<Badge key={k} variant="blue">
												{k}
											</Badge>
										))}
									</div>
								</div>
							)}
					</div>
				</div>

				{/* Attributes */}
				<div className="border-(--sv-border-2) border-b p-4">
					<h4 className="mb-2 font-semibold text-(--sv-text-3) text-xs uppercase tracking-wide">
						Attributes ({schema.attributes?.length ?? 0})
					</h4>
					{schema.attributes && schema.attributes.length > 0 ? (
						<div className="space-y-2">
							{schema.attributes.map((attr) => (
								<div
									key={attr.name}
									className={cn(
										"rounded border p-2 text-sm",
										attr.inherited
											? "border-(--sv-border-2) bg-(--sv-surface-2)"
											: "border-(--sv-border)",
									)}
								>
									<div className="flex items-center justify-between">
										<span className="font-medium text-(--sv-text-2)">
											{attr.label ?? attr.name}
											{attr.optional && (
												<span className="ml-1 text-(--sv-text-5)">?</span>
											)}
										</span>
										<Badge variant="gray">{attr.kind}</Badge>
									</div>
									{attr.description && (
										<p className="mt-1 text-(--sv-text-4) text-xs">
											{attr.description}
										</p>
									)}
									<div className="mt-1 flex flex-wrap gap-1">
										{attr.inherited && (
											<Badge variant="yellow">inherited</Badge>
										)}
										{attr.unique && <Badge variant="red">unique</Badge>}
										{attr.read_only && <Badge variant="blue">read-only</Badge>}
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-(--sv-text-5) text-sm">No attributes</p>
					)}
				</div>

				{/* Relationships */}
				<div className="p-4">
					<h4 className="mb-2 font-semibold text-(--sv-text-3) text-xs uppercase tracking-wide">
						Relationships ({schema.relationships?.length ?? 0})
					</h4>
					{schema.relationships && schema.relationships.length > 0 ? (
						<div className="space-y-2">
							{schema.relationships.map((rel) => (
								<div
									key={rel.name}
									className={cn(
										"rounded border p-2 text-sm",
										rel.inherited
											? "border-(--sv-border-2) bg-(--sv-surface-2)"
											: "border-(--sv-border)",
									)}
								>
									<div className="flex items-center justify-between">
										<span className="font-medium text-(--sv-text-2)">
											{rel.label ?? rel.name}
										</span>
										<div className="flex items-center gap-1">
											<Badge
												variant={rel.cardinality === "many" ? "blue" : "gray"}
											>
												{rel.cardinality}
											</Badge>
											<span className="text-(--sv-text-4) text-xs">
												→ {rel.peer}
											</span>
										</div>
									</div>
									{rel.description && (
										<p className="mt-1 text-(--sv-text-4) text-xs">
											{rel.description}
										</p>
									)}
									<div className="mt-1 flex flex-wrap gap-1">
										{rel.inherited && <Badge variant="yellow">inherited</Badge>}
										{rel.optional && <Badge variant="gray">optional</Badge>}
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-(--sv-text-5) text-sm">No relationships</p>
					)}
				</div>
			</div>
		</div>
	);
}
