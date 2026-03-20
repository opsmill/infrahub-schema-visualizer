import type {
	NodeSchema,
	ProfileSchema,
	SchemaVisualizerData,
	TemplateSchema,
} from "../types/schema";
import { getSchemaKind } from "../utils/schema-to-flow";

type SchemaItem = {
	schema: NodeSchema | ProfileSchema | TemplateSchema;
	type: "node" | "profile" | "template";
};

/**
 * Compute default hidden nodes based on schema data.
 * Hides Core/Builtin namespaces, all profiles, and all templates.
 */
export function getDefaultHiddenNodes(data: SchemaVisualizerData): Set<string> {
	const hidden = new Set<string>();
	const hiddenNamespaces = ["Core", "Builtin"];
	for (const node of data.nodes) {
		if (hiddenNamespaces.includes(node.namespace)) {
			hidden.add(getSchemaKind(node));
		}
	}
	for (const profile of data.profiles ?? []) {
		hidden.add(getSchemaKind(profile));
	}
	for (const template of data.templates ?? []) {
		hidden.add(getSchemaKind(template));
	}
	return hidden;
}

/**
 * Groups all schemas (nodes, profiles, templates) by namespace.
 */
export function groupSchemasByNamespace(
	data: SchemaVisualizerData,
): Map<string, SchemaItem[]> {
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
}

/**
 * Count visible schemas (not in hiddenNodes set).
 */
export function countVisibleSchemas(
	data: SchemaVisualizerData,
	hiddenNodes: Set<string>,
): number {
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
}

/**
 * Count total schemas (nodes + profiles + templates).
 */
export function countTotalSchemas(data: SchemaVisualizerData): number {
	return (
		data.nodes.length +
		(data.profiles?.length ?? 0) +
		(data.templates?.length ?? 0)
	);
}

/**
 * Find a schema by kind across nodes, profiles, and templates.
 */
export function findSchemaByKind(
	data: SchemaVisualizerData,
	kind: string,
): NodeSchema | ProfileSchema | TemplateSchema | null {
	const node = data.nodes.find((n) => getSchemaKind(n) === kind);
	if (node) return node;
	const profile = (data.profiles ?? []).find((p) => getSchemaKind(p) === kind);
	if (profile) return profile;
	const template = (data.templates ?? []).find(
		(t) => getSchemaKind(t) === kind,
	);
	if (template) return template;
	return null;
}

/**
 * Get all peer node kinds for a given schema kind (based on relationships).
 * Resolves generics to their inheriting concrete schemas.
 */
export function getPeerKinds(
	nodeKind: string,
	data: SchemaVisualizerData,
): Set<string> {
	const peers = new Set<string>();

	const addPeersFromSchema = (
		schema: NodeSchema | ProfileSchema | TemplateSchema,
	) => {
		for (const rel of schema.relationships ?? []) {
			peers.add(rel.peer);
			const generic = data.generics.find((g) => getSchemaKind(g) === rel.peer);
			if (generic) {
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

	const schema = findSchemaByKind(data, nodeKind);
	if (schema) {
		addPeersFromSchema(schema);
	}

	return peers;
}
