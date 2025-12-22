/**
 * Schema types for the schema visualizer component.
 * These types are designed to be framework-agnostic so they can be used
 * by external tools that integrate with Infrahub.
 */

export interface AttributeSchema {
	id?: string | null;
	name: string;
	kind: string;
	label?: string | null;
	description?: string | null;
	optional?: boolean;
	unique?: boolean;
	read_only?: boolean;
	inherited?: boolean;
}

export interface RelationshipSchema {
	id?: string | null;
	name: string;
	peer: string;
	kind: string;
	label?: string | null;
	description?: string | null;
	identifier?: string | null;
	cardinality: "one" | "many";
	optional?: boolean;
	inherited?: boolean;
	min_count?: number;
	max_count?: number;
}

export interface BaseSchema {
	id?: string | null;
	name: string;
	namespace: string;
	kind?: string | null;
	label?: string | null;
	description?: string | null;
	icon?: string | null;
	attributes?: AttributeSchema[];
	relationships?: RelationshipSchema[];
}

export interface NodeSchema extends BaseSchema {
	inherit_from?: string[];
	hierarchy?: string | null;
	parent?: string | null;
	children?: string | null;
}

export interface GenericSchema extends BaseSchema {
	used_by?: string[];
	hierarchical?: boolean;
}

export interface ProfileSchema extends BaseSchema {
	profile_priority?: number;
}

export interface TemplateSchema extends BaseSchema {
	inherit_from?: string[];
}

export type SchemaType = "node" | "generic" | "profile" | "template";

export interface SchemaVisualizerData {
	nodes: NodeSchema[];
	generics: GenericSchema[];
	profiles?: ProfileSchema[];
	templates?: TemplateSchema[];
}
