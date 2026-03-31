import { Provider, createStore } from "jotai";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";

import { collapsedNodesSetAtom } from "../../store/visualizer-atoms";
import type { SchemaNodeData } from "../../utils/schema-to-flow";
import { SchemaNode } from "./schema-node";

vi.mock("@xyflow/react", () => ({
	Handle: () => null,
	Position: { Left: "left", Right: "right" },
}));

function renderSchemaNode(
	data: SchemaNodeData,
	options: { selected?: boolean; collapsed?: boolean } = {},
) {
	const { selected = false, collapsed = false } = options;
	const store = createStore();

	if (collapsed) {
		store.set(collapsedNodesSetAtom, new Set([data.kind]));
	}

	return render(
		<Provider store={store}>
			<SchemaNode
				id={data.kind}
				type="schemaNode"
				data={data}
				selected={selected}
				dragging={false}
				zIndex={0}
				positionAbsoluteX={0}
				positionAbsoluteY={0}
				width={300}
				height={200}
				parentId={undefined}
				deletable={false}
				selectable
				draggable
				isConnectable
				measured={{ width: 300, height: 200 }}
			/>
		</Provider>,
	);
}

function buildNodeData(
	overrides: Partial<SchemaNodeData> = {},
): SchemaNodeData {
	return {
		kind: "TestNamespace",
		label: "Test Node",
		namespace: "Test",
		attributes: [],
		relationships: [],
		schemaType: "node",
		...overrides,
	};
}

describe("SchemaNode", () => {
	describe("schema types", () => {
		test("renders a node schema with label and kind", async () => {
			// GIVEN
			const data = buildNodeData({
				kind: "InfraDevice",
				label: "Device",
				schemaType: "node",
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(component.getByRole("heading", { name: "Device" }))
				.toBeVisible();
			await expect
				.element(component.getByText("InfraDevice"))
				.toBeVisible();
		});

		test("renders a generic schema with type badge", async () => {
			// GIVEN
			const data = buildNodeData({
				kind: "InfraGenericInterface",
				label: "Generic Interface",
				schemaType: "generic",
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(
					component.getByRole("heading", { name: "Generic Interface" }),
				)
				.toBeVisible();
			await expect
				.element(component.getByText("Generic", { exact: true }))
				.toBeVisible();
		});

		test("renders a profile schema with type badge", async () => {
			// GIVEN
			const data = buildNodeData({
				kind: "ProfileInfraDevice",
				label: "Device Profile",
				schemaType: "profile",
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(
					component.getByRole("heading", { name: "Device Profile" }),
				)
				.toBeVisible();
			await expect
				.element(component.getByText("Profile", { exact: true }))
				.toBeVisible();
		});

		test("renders a template schema with type badge", async () => {
			// GIVEN
			const data = buildNodeData({
				kind: "TemplateInfraDevice",
				label: "Device Template",
				schemaType: "template",
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(
					component.getByRole("heading", { name: "Device Template" }),
				)
				.toBeVisible();
			await expect
				.element(component.getByText("Template", { exact: true }))
				.toBeVisible();
		});

		test("does not render a type badge for node schemas", async () => {
			// GIVEN
			const data = buildNodeData({
				kind: "InfraDevice",
				label: "Device",
				schemaType: "node",
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(component.getByRole("heading", { name: "Device" }))
				.toBeVisible();
			// Node type has no badge label (config.label is null)
			expect(component.container.querySelector(".bg-gray-300\\/50")).toBeNull();
		});
	});

	describe("attributes", () => {
		test("renders attributes section with count", async () => {
			// GIVEN
			const data = buildNodeData({
				attributes: [
					{ name: "hostname", kind: "Text" },
					{ name: "ip_address", kind: "IPHost" },
				],
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(component.getByText("Attributes (2)"))
				.toBeVisible();
			await expect.element(component.getByText("hostname")).toBeVisible();
			await expect
				.element(component.getByText("ip_address"))
				.toBeVisible();
		});

		test("marks optional attributes with question mark", async () => {
			// GIVEN
			const data = buildNodeData({
				attributes: [{ name: "description", kind: "Text", optional: true }],
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect.element(component.getByText("?")).toBeVisible();
		});

		test("marks inherited attributes with badge", async () => {
			// GIVEN
			const data = buildNodeData({
				attributes: [{ name: "name", kind: "Text", inherited: true }],
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(component.getByText("(inherited)"))
				.toBeVisible();
		});

		test("does not render attributes section when empty", async () => {
			// GIVEN
			const data = buildNodeData({ attributes: [] });

			const component = await renderSchemaNode(data);

			// THEN
			expect(component.container.textContent).not.toContain("Attributes");
		});
	});

	describe("relationships", () => {
		test("renders relationships section with count", async () => {
			// GIVEN
			const data = buildNodeData({
				kind: "InfraDevice",
				relationships: [
					{
						name: "interfaces",
						peer: "InfraInterface",
						cardinality: "many",
					},
					{ name: "primary_site", peer: "LocationSite", cardinality: "one" },
				],
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(component.getByText("Relationships (2)"))
				.toBeVisible();
			await expect
				.element(component.getByText("interfaces"))
				.toBeVisible();
			await expect
				.element(component.getByText("primary_site"))
				.toBeVisible();
			await expect.element(component.getByText("many")).toBeVisible();
			await expect.element(component.getByText("one")).toBeVisible();
		});

		test("shows peer kind for non-self-referencing relationships", async () => {
			// GIVEN
			const data = buildNodeData({
				kind: "InfraDevice",
				relationships: [
					{ name: "primary_site", peer: "LocationSite", cardinality: "one" },
				],
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(component.getByText("→ LocationSite"))
				.toBeVisible();
		});

		test("shows self-reference indicator for self-referencing relationships", async () => {
			// GIVEN
			const data = buildNodeData({
				kind: "InfraDevice",
				relationships: [
					{
						name: "connected_to",
						peer: "InfraDevice",
						cardinality: "many",
					},
				],
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect.element(component.getByText("self")).toBeVisible();
		});

		test("marks inherited relationships with badge", async () => {
			// GIVEN
			const data = buildNodeData({
				relationships: [
					{
						name: "tags",
						peer: "BuiltinTag",
						cardinality: "many",
						inherited: true,
					},
				],
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(component.getByText("(inherited)"))
				.toBeVisible();
		});

		test("does not render relationships section when empty", async () => {
			// GIVEN
			const data = buildNodeData({ relationships: [] });

			const component = await renderSchemaNode(data);

			// THEN
			expect(component.container.textContent).not.toContain("Relationships");
		});
	});

	describe("inheritance", () => {
		test("renders inherit_from badges", async () => {
			// GIVEN
			const data = buildNodeData({
				inheritFrom: ["InfraGenericInterface", "CoreNode"],
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(component.getByText("↑ InfraGenericInterface"))
				.toBeVisible();
			await expect
				.element(component.getByText("↑ CoreNode"))
				.toBeVisible();
		});

		test("does not render inheritance section when empty", async () => {
			// GIVEN
			const data = buildNodeData({ inheritFrom: [] });

			const component = await renderSchemaNode(data);

			// THEN
			expect(component.container.textContent).not.toContain("↑");
		});
	});

	describe("collapsed state", () => {
		test("hides attributes and relationships when collapsed", async () => {
			// GIVEN
			const data = buildNodeData({
				kind: "InfraDevice",
				attributes: [{ name: "hostname", kind: "Text" }],
				relationships: [
					{ name: "primary_site", peer: "LocationSite", cardinality: "one" },
				],
			});

			const component = await renderSchemaNode(data, { collapsed: true });

			// THEN
			await expect
				.element(component.getByText("InfraDevice"))
				.toBeVisible();
			expect(component.container.textContent).not.toContain("hostname");
			expect(component.container.textContent).not.toContain("primary_site");
			expect(component.container.textContent).not.toContain("Attributes");
			expect(component.container.textContent).not.toContain("Relationships");
		});

		test("shows attributes and relationships when expanded", async () => {
			// GIVEN
			const data = buildNodeData({
				attributes: [{ name: "hostname", kind: "Text" }],
				relationships: [
					{ name: "primary_site", peer: "LocationSite", cardinality: "one" },
				],
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect.element(component.getByText("hostname")).toBeVisible();
			await expect.element(component.getByText("primary_site")).toBeVisible();
		});
	});

	describe("empty node", () => {
		test("renders node with no attributes and no relationships", async () => {
			// GIVEN
			const data = buildNodeData({
				kind: "InfraEmpty",
				label: "Empty Node",
				attributes: [],
				relationships: [],
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(component.getByRole("heading", { name: "Empty Node" }))
				.toBeVisible();
			await expect
				.element(component.getByText("InfraEmpty"))
				.toBeVisible();
			expect(component.container.textContent).not.toContain("Attributes");
			expect(component.container.textContent).not.toContain("Relationships");
		});
	});

	describe("combined scenarios", () => {
		test("renders a node with attributes, relationships, and inheritance", async () => {
			// GIVEN
			const data = buildNodeData({
				kind: "InfraDevice",
				label: "Device",
				schemaType: "node",
				inheritFrom: ["InfraGenericDevice"],
				attributes: [
					{ name: "hostname", kind: "Text" },
					{ name: "name", kind: "Text", inherited: true },
				],
				relationships: [
					{
						name: "interfaces",
						peer: "InfraInterface",
						cardinality: "many",
					},
					{
						name: "tags",
						peer: "BuiltinTag",
						cardinality: "many",
						inherited: true,
					},
				],
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(component.getByRole("heading", { name: "Device" }))
				.toBeVisible();
			await expect
				.element(component.getByText("InfraDevice"))
				.toBeVisible();
			await expect
				.element(component.getByText("↑ InfraGenericDevice"))
				.toBeVisible();
			await expect
				.element(component.getByText("Attributes (2)"))
				.toBeVisible();
			await expect
				.element(component.getByText("Relationships (2)"))
				.toBeVisible();
			await expect.element(component.getByText("hostname")).toBeVisible();
			await expect
				.element(component.getByText("interfaces"))
				.toBeVisible();
		});

		test("renders a generic with attributes and relationships", async () => {
			// GIVEN
			const data = buildNodeData({
				kind: "InfraGenericInterface",
				label: "Generic Interface",
				schemaType: "generic",
				attributes: [{ name: "speed", kind: "Number" }],
				relationships: [
					{ name: "device", peer: "InfraDevice", cardinality: "one" },
				],
			});

			const component = await renderSchemaNode(data);

			// THEN
			await expect
				.element(
					component.getByRole("heading", { name: "Generic Interface" }),
				)
				.toBeVisible();
			await expect
				.element(component.getByText("Generic", { exact: true }))
				.toBeVisible();
			await expect
				.element(component.getByText("Attributes (1)"))
				.toBeVisible();
			await expect
				.element(component.getByText("Relationships (1)"))
				.toBeVisible();
		});
	});
});
