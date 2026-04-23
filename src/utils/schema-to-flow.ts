import type { Edge, Node } from "@xyflow/react";
import type {
	GenericSchema,
	NodeSchema,
	ProfileSchema,
	TemplateSchema,
} from "../types/schema";

export interface SchemaNodeData extends Record<string, unknown> {
	kind: string;
	label: string;
	namespace: string;
	description?: string | null;
	icon?: string | null;
	attributes: Array<{
		name: string;
		kind: string;
		label?: string | null;
		optional?: boolean;
		inherited?: boolean;
	}>;
	relationships: Array<{
		name: string;
		peer: string;
		cardinality: "one" | "many";
		label?: string | null;
		inherited?: boolean;
	}>;
	inheritFrom?: string[];
	schemaType: "node" | "generic" | "profile" | "template";
}

type SchemaFlowNode = Node<SchemaNodeData, "schemaNode">;

interface SchemaFlowData {
	nodes: SchemaFlowNode[];
	edges: Edge[];
}

/**
 * Get the kind identifier for a schema
 */
export function getSchemaKind(
	schema: NodeSchema | GenericSchema | ProfileSchema | TemplateSchema,
): string {
	return schema.kind ?? `${schema.namespace}${schema.name}`;
}

/**
 * Converts schema data to React Flow nodes and edges with visibility filtering.
 * Only visible nodes (not in hiddenNodes set) are rendered.
 * Supports nodes, profiles, and templates.
 */
export function schemaToFlowFiltered(
	nodes: NodeSchema[],
	generics: GenericSchema[],
	hiddenNodes: Set<string>,
	options: {
		nodeSpacing?: number;
		rowSize?: number;
		profiles?: ProfileSchema[];
		templates?: TemplateSchema[];
	} = {},
): SchemaFlowData {
	const {
		nodeSpacing = 400,
		rowSize = 4,
		profiles = [],
		templates = [],
	} = options;

	const flowNodes: SchemaFlowNode[] = [];
	const edges: Edge[] = [];

	// Create a map of generics for quick lookup
	const genericsMap = new Map<string, GenericSchema>();
	for (const generic of generics) {
		const kind = getSchemaKind(generic);
		genericsMap.set(kind, generic);
	}

	// Filter nodes based on visibility - only check hiddenNodes
	const visibleNodes = nodes.filter((node) => {
		const kind = getSchemaKind(node);
		return !hiddenNodes.has(kind);
	});

	// Filter generics based on visibility
	const visibleGenerics = generics.filter((generic) => {
		const kind = getSchemaKind(generic);
		return !hiddenNodes.has(kind);
	});

	// Filter profiles based on visibility
	const visibleProfiles = profiles.filter((profile) => {
		const kind = getSchemaKind(profile);
		return !hiddenNodes.has(kind);
	});

	// Filter templates based on visibility
	const visibleTemplates = templates.filter((template) => {
		const kind = getSchemaKind(template);
		return !hiddenNodes.has(kind);
	});

	// Create a map of all visible schema kinds for relationship edge creation.
	// Generics are intentionally excluded here so relationships targeting a
	// generic fall through to the inheritance fan-out branch below instead of
	// drawing a direct edge to the generic box (which isn't rendered).
	const allVisibleKinds = new Set<string>();
	for (const node of visibleNodes) {
		allVisibleKinds.add(getSchemaKind(node));
	}
	for (const profile of visibleProfiles) {
		allVisibleKinds.add(getSchemaKind(profile));
	}
	for (const template of visibleTemplates) {
		allVisibleKinds.add(getSchemaKind(template));
	}

	// Create a map of generic kind -> visible nodes that inherit from it
	const genericToInheritingNodes = new Map<string, string[]>();
	for (const node of visibleNodes) {
		for (const inheritedKind of node.inherit_from ?? []) {
			if (genericsMap.has(inheritedKind)) {
				if (!genericToInheritingNodes.has(inheritedKind)) {
					genericToInheritingNodes.set(inheritedKind, []);
				}
				genericToInheritingNodes.get(inheritedKind)?.push(getSchemaKind(node));
			}
		}
	}
	for (const template of visibleTemplates) {
		for (const inheritedKind of template.inherit_from ?? []) {
			if (genericsMap.has(inheritedKind)) {
				if (!genericToInheritingNodes.has(inheritedKind)) {
					genericToInheritingNodes.set(inheritedKind, []);
				}
				genericToInheritingNodes
					.get(inheritedKind)
					?.push(getSchemaKind(template));
			}
		}
	}

	// Build a lookup map from kind -> schema for O(1) access in edge creation
	const schemaByKind = new Map<
		string,
		NodeSchema | GenericSchema | ProfileSchema | TemplateSchema
	>();
	for (const node of visibleNodes) {
		schemaByKind.set(getSchemaKind(node), node);
	}
	for (const generic of visibleGenerics) {
		schemaByKind.set(getSchemaKind(generic), generic);
	}
	for (const profile of visibleProfiles) {
		schemaByKind.set(getSchemaKind(profile), profile);
	}
	for (const template of visibleTemplates) {
		schemaByKind.set(getSchemaKind(template), template);
	}

	// Find the reverse relationship name from a target schema back to a source kind
	const findTargetRelName = (
		targetKind: string,
		sourceKind: string,
	): string | null => {
		const targetSchema = schemaByKind.get(targetKind);
		if (!targetSchema) return null;
		const matchingRel = (targetSchema.relationships ?? []).find(
			(r) => r.peer === sourceKind,
		);
		return matchingRel?.name ?? null;
	};

	// Helper function to create edges for a schema's relationships
	const createEdgesForSchema = (
		schema: NodeSchema | GenericSchema | ProfileSchema | TemplateSchema,
		kind: string,
		schemaType: "node" | "generic" | "profile" | "template",
	) => {
		for (const rel of schema.relationships ?? []) {
			// Check if the peer is a visible schema
			if (allVisibleKinds.has(rel.peer)) {
				const targetRelName = findTargetRelName(rel.peer, kind);

				edges.push({
					id: `${kind}-${rel.name}-${rel.peer}`,
					source: kind,
					target: rel.peer,
					type: "floating",
					animated: rel.cardinality === "many",
					data: {
						sourceRelName: rel.name,
						targetRelName,
						sourceCardinality: "one",
						targetCardinality: rel.cardinality,
					},
					style: {
						stroke: rel.inherited ? "#009966" : getEdgeColorForType(schemaType),
						strokeWidth: 2,
					},
				});
			}
			// Check if the peer is a generic - create edges to all inheriting schemas
			else if (genericsMap.has(rel.peer)) {
				const inheritingSchemas = genericToInheritingNodes.get(rel.peer) ?? [];
				for (const inheritingSchemaKind of inheritingSchemas) {
					const targetRelName = findTargetRelName(inheritingSchemaKind, kind);

					edges.push({
						id: `${kind}-${rel.name}-${inheritingSchemaKind}`,
						source: kind,
						target: inheritingSchemaKind,
						type: "floating",
						animated: rel.cardinality === "many",
						data: {
							sourceRelName: rel.name,
							targetRelName,
							sourceCardinality: "one",
							targetCardinality: rel.cardinality,
						},
						style: {
							stroke: "#009966",
							strokeWidth: 2,
							strokeDasharray: "5,5",
						},
					});
				}
			}
		}
	};

	// Helper function to get edge color based on schema type
	const getEdgeColorForType = (
		schemaType: "node" | "generic" | "profile" | "template",
	): string => {
		switch (schemaType) {
			case "generic":
				return "#009966"; // Green for generics
			case "profile":
				return "#7F22FE"; // Purple for profiles
			case "template":
				return "#F54900"; // Orange for templates
			default:
				return "#087895"; // Teal for nodes
		}
	};

	// Helper function to find inherited generics for any schema with inherit_from
	const findInheritedGenericsForSchema = (
		schema: NodeSchema | TemplateSchema,
	): string[] => {
		if (
			!("inherit_from" in schema) ||
			!schema.inherit_from ||
			schema.inherit_from.length === 0
		) {
			return [];
		}
		return schema.inherit_from.filter((kind) => genericsMap.has(kind));
	};

	// Group all schemas by namespace for layout
	const namespaceGroups = new Map<
		string,
		Array<{
			schema: NodeSchema | GenericSchema | ProfileSchema | TemplateSchema;
			type: "node" | "generic" | "profile" | "template";
		}>
	>();

	for (const node of visibleNodes) {
		if (!namespaceGroups.has(node.namespace)) {
			namespaceGroups.set(node.namespace, []);
		}
		namespaceGroups.get(node.namespace)?.push({ schema: node, type: "node" });
	}

	// Generics are intentionally not added to the layout — they are kept in the
	// schema data (genericsMap, genericToInheritingNodes, inheritFrom badges) but
	// hidden from the rendered graph until the underlying linking bug is fixed.

	for (const profile of visibleProfiles) {
		if (!namespaceGroups.has(profile.namespace)) {
			namespaceGroups.set(profile.namespace, []);
		}
		namespaceGroups
			.get(profile.namespace)
			?.push({ schema: profile, type: "profile" });
	}

	for (const template of visibleTemplates) {
		if (!namespaceGroups.has(template.namespace)) {
			namespaceGroups.set(template.namespace, []);
		}
		namespaceGroups
			.get(template.namespace)
			?.push({ schema: template, type: "template" });
	}

	// Layout schemas by namespace
	let currentY = 0;
	const namespaceSpacing = 150;

	for (const [, groupItems] of namespaceGroups) {
		groupItems.forEach((item, index) => {
			const { schema, type } = item;
			const kind = getSchemaKind(schema);

			// Find inherited generics (only for nodes and templates)
			const inheritedGenerics =
				type === "node" || type === "template"
					? findInheritedGenericsForSchema(
							schema as NodeSchema | TemplateSchema,
						)
					: [];

			const col = index % rowSize;
			const row = Math.floor(index / rowSize);

			const flowNode: SchemaFlowNode = {
				id: kind,
				type: "schemaNode",
				position: {
					x: col * nodeSpacing,
					y: currentY + row * nodeSpacing,
				},
				data: {
					kind,
					label: schema.label ?? schema.name,
					namespace: schema.namespace,
					description: schema.description,
					icon: schema.icon,
					attributes: (schema.attributes ?? []).map((attr) => ({
						name: attr.name,
						kind: attr.kind,
						label: attr.label,
						optional: attr.optional,
						inherited: attr.inherited,
					})),
					relationships: (schema.relationships ?? []).map((rel) => ({
						name: rel.name,
						peer: rel.peer,
						cardinality: rel.cardinality,
						label: rel.label,
						inherited: rel.inherited,
					})),
					inheritFrom: inheritedGenerics,
					schemaType: type,
				},
			};

			flowNodes.push(flowNode);

			// Create edges for relationships
			createEdgesForSchema(schema, kind, type);
		});

		// Calculate height of this namespace group
		const groupRows = Math.ceil(groupItems.length / rowSize);
		currentY += groupRows * nodeSpacing + namespaceSpacing;
	}

	return { nodes: flowNodes, edges };
}
