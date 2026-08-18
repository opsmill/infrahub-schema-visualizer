import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";

import type { SchemaVisualizerData } from "../../types/schema";
import { SchemaVisualizer } from "./schema-visualizer";

const data: SchemaVisualizerData = {
	nodes: [
		{
			name: "Device",
			namespace: "Infra",
			kind: "InfraDevice",
			label: "Device",
			attributes: [{ name: "hostname", kind: "Text" }],
			relationships: [],
		},
	],
	generics: [],
};

function getRoot(container: HTMLElement) {
	return container.querySelector(".schema-visualizer");
}

describe("SchemaVisualizer theming", () => {
	test("defaults to the light theme", async () => {
		// GIVEN
		const component = await render(<SchemaVisualizer data={data} />);

		// THEN
		const root = getRoot(component.container);
		expect(root).not.toBeNull();
		expect(root?.getAttribute("data-theme")).toBe("light");
		expect(component.container.querySelector(".react-flow.dark")).toBeNull();
	});

	test("applies the dark theme when passed by the embedder", async () => {
		// GIVEN
		const component = await render(
			<SchemaVisualizer data={data} theme="dark" />,
		);

		// THEN
		const root = getRoot(component.container);
		expect(root).not.toBeNull();
		expect(root?.getAttribute("data-theme")).toBe("dark");
		// ReactFlow's own chrome follows via its colorMode class
		expect(
			component.container.querySelector(".react-flow.dark"),
		).not.toBeNull();
	});
});
