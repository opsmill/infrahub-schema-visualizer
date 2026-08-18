import { Icon } from "@iconify-icon/react";
import { useState } from "react";
import type {
	GenericSchema,
	NodeSchema,
	ProfileSchema,
	TemplateSchema,
} from "../../types/schema";
import { cn } from "../../utils/cn";
import { getSchemaIcon } from "../../utils/get-schema-icon";
import { getSchemaKind } from "../../utils/schema-to-flow";

export type SchemaItem = {
	schema: NodeSchema | GenericSchema | ProfileSchema | TemplateSchema;
	type: "node" | "generic" | "profile" | "template";
};

export interface FilterPanelProps {
	namespaceSchemas: Map<string, SchemaItem[]>;
	hiddenNodes: Set<string>;
	onToggleNamespace: (namespace: string) => void;
	onToggleNode: (kind: string) => void;
	onFocusNode: (kind: string) => void;
	onClose: () => void;
	onHoverNode?: (kind: string | null) => void;
}

// Get badge color based on schema type
const getTypeBadgeColor = (
	type: "node" | "generic" | "profile" | "template",
) => {
	switch (type) {
		case "generic":
			return "bg-(--sv-generic)/10 text-(--sv-generic-text)";
		case "profile":
			return "bg-(--sv-profile)/10 text-(--sv-profile-text)";
		case "template":
			return "bg-(--sv-template)/10 text-(--sv-template-text)";
		default:
			return "bg-(--sv-node)/10 text-(--sv-node-text)";
	}
};

export function FilterPanel({
	namespaceSchemas,
	hiddenNodes,
	onToggleNamespace,
	onToggleNode,
	onFocusNode,
	onClose,
	onHoverNode,
}: FilterPanelProps) {
	const [expandedNamespaces, setExpandedNamespaces] = useState<Set<string>>(
		new Set(),
	);
	const [searchTerm, setSearchTerm] = useState("");

	const toggleExpand = (namespace: string) => {
		setExpandedNamespaces((prev) => {
			const next = new Set(prev);
			if (next.has(namespace)) {
				next.delete(namespace);
			} else {
				next.add(namespace);
			}
			return next;
		});
	};

	const namespaces = Array.from(namespaceSchemas.keys()).sort();
	const term = searchTerm.toLowerCase().trim();

	const matchesSearch = (item: SchemaItem) =>
		item.schema.name.toLowerCase().includes(term) ||
		(item.schema.label?.toLowerCase().includes(term) ?? false) ||
		(item.schema.kind?.toLowerCase().includes(term) ?? false) ||
		item.type.toLowerCase().includes(term);

	const filteredNamespaces = term
		? namespaces.filter(
				(ns) =>
					ns.toLowerCase().includes(term) ||
					(namespaceSchemas.get(ns) ?? []).some(matchesSearch),
			)
		: namespaces;

	const getFilteredSchemas = (namespace: string) => {
		const nsSchemas = namespaceSchemas.get(namespace) ?? [];
		if (!term || namespace.toLowerCase().includes(term)) return nsSchemas;
		return nsSchemas.filter(matchesSearch);
	};

	return (
		<div className="flex h-full w-80 flex-col border-(--sv-border) border-l bg-(--sv-surface)">
			<div className="flex items-center justify-between border-(--sv-border) border-b px-4 py-3">
				<h3 className="font-semibold text-(--sv-text-2)">Filter Schemas</h3>
				<button
					type="button"
					onClick={onClose}
					className="p-1 rounded hover:bg-(--sv-surface-3) text-(--sv-text-4)"
				>
					<Icon icon="mdi:close" className="text-lg" />
				</button>
			</div>

			{/* Search input */}
			<div className="border-(--sv-border) border-b px-3 py-2">
				<div className="relative">
					<Icon
						icon="mdi:magnify"
						className="-translate-y-1/2 absolute top-1/2 left-2.5 text-(--sv-text-5) text-lg"
					/>
					<input
						type="text"
						placeholder="Search schemas..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full rounded-md border border-(--sv-border) py-1.5 pr-8 pl-9 text-sm placeholder:text-(--sv-text-5) focus:border-(--sv-accent) focus:outline-none focus:ring-1 focus:ring-(--sv-accent)"
					/>
					{searchTerm && (
						<button
							type="button"
							onClick={() => setSearchTerm("")}
							className="-translate-y-1/2 absolute top-1/2 right-2 text-(--sv-text-5) hover:text-(--sv-text-3)"
						>
							<Icon icon="mdi:close-circle" className="text-lg" />
						</button>
					)}
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-2">
				{filteredNamespaces.length === 0 && searchTerm && (
					<div className="px-4 py-8 text-center text-(--sv-text-5) text-sm">
						No schemas found matching "{searchTerm}"
					</div>
				)}
				{filteredNamespaces.map((namespace) => {
					const nsSchemas = namespaceSchemas.get(namespace) ?? [];
					const filteredSchemas = getFilteredSchemas(namespace);
					const isExpanded =
						expandedNamespaces.has(namespace) || searchTerm.trim() !== "";
					const visibleCount = nsSchemas.filter(
						(item) => !hiddenNodes.has(getSchemaKind(item.schema)),
					).length;
					const allHidden = visibleCount === 0;
					const allVisible = visibleCount === nsSchemas.length;

					return (
						<div key={namespace} className="mb-1">
							<div
								className={cn(
									"flex items-center gap-2 rounded px-2 py-1.5 hover:bg-(--sv-surface-3)",
									allHidden ? "opacity-50" : "",
								)}
							>
								<button
									type="button"
									onClick={() => toggleExpand(namespace)}
									className="flex h-5 w-5 items-center justify-center text-(--sv-text-4)"
								>
									<Icon
										icon={isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
										className="text-lg"
									/>
								</button>
								<button
									type="button"
									onClick={() => onToggleNamespace(namespace)}
									className="flex h-5 w-5 items-center justify-center"
								>
									<Icon
										icon={
											allHidden
												? "mdi:checkbox-blank-outline"
												: allVisible
													? "mdi:checkbox-marked"
													: "mdi:minus-box"
										}
										className={cn(
											"text-lg",
											allHidden
												? "text-(--sv-text-5)"
												: "text-(--sv-accent-text)",
										)}
									/>
								</button>
								<span className="flex-1 font-medium text-(--sv-text-2) text-sm">
									{namespace}
								</span>
								<span className="px-1.5 py-0.5 rounded bg-(--sv-surface-3) text-(--sv-text-4) text-xs">
									{visibleCount}/{nsSchemas.length}
								</span>
							</div>
							{isExpanded && (
								<div className="ml-6 space-y-0.5 py-1">
									{filteredSchemas.map((item) => {
										const kind = getSchemaKind(item.schema);
										const isSchemaHidden = hiddenNodes.has(kind);
										return (
											// biome-ignore lint/a11y/useSemanticElements: Using div for hover highlighting wrapper is intentional
											<div
												key={kind}
												role="group"
												className={cn(
													"flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-(--sv-surface-3)",
													isSchemaHidden ? "opacity-50" : "",
												)}
												onMouseEnter={() =>
													!isSchemaHidden && onHoverNode?.(kind)
												}
												onMouseLeave={() => onHoverNode?.(null)}
											>
												<button
													type="button"
													onClick={() => onToggleNode(kind)}
													className="flex h-5 w-5 shrink-0 items-center justify-center"
												>
													<Icon
														icon={
															isSchemaHidden
																? "mdi:checkbox-blank-outline"
																: "mdi:checkbox-marked"
														}
														className={cn(
															"text-lg",
															isSchemaHidden
																? "text-(--sv-text-5)"
																: "text-(--sv-accent-text)",
														)}
													/>
												</button>
												<Icon
													icon={getSchemaIcon(item.schema)}
													className="shrink-0 text-(--sv-text-4) text-sm"
												/>
												<span className="min-w-0 flex-1 truncate text-left text-(--sv-text-3) text-sm">
													{item.schema.label ?? item.schema.name}
												</span>
												{item.type !== "node" && (
													<span
														className={cn(
															"px-1 py-0.5 rounded text-[9px] uppercase font-medium",
															getTypeBadgeColor(item.type),
														)}
													>
														{item.type}
													</span>
												)}
												{!isSchemaHidden && (
													<button
														type="button"
														onClick={() => onFocusNode(kind)}
														className="flex h-5 w-5 shrink-0 items-center justify-center text-(--sv-text-5) hover:text-(--sv-accent-text)"
														title="Focus on schema"
													>
														<Icon icon="mdi:target" className="text-sm" />
													</button>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
