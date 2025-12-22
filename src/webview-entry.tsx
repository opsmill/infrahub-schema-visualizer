/**
 * Webview entry point for VSCode extension.
 * This file creates a global function that can be called from the webview HTML
 * to render the SchemaVisualizer component.
 *
 * The bundle is completely self-contained with all styles and dependencies.
 */
import { createRoot } from "react-dom/client";
import { SchemaVisualizer } from "./components/SchemaVisualizer";
import type { SchemaVisualizerData } from "./types/schema";
import "./webview.css";

// Define the global interface for VSCode communication
declare global {
	interface Window {
		acquireVsCodeApi?: () => {
			postMessage: (message: unknown) => void;
			getState: () => unknown;
			setState: (state: unknown) => void;
		};
		__vscodeApi?: {
			postMessage: (message: unknown) => void;
			getState: () => unknown;
			setState: (state: unknown) => void;
		};
		renderSchemaVisualizer: (
			container: HTMLElement,
			data: SchemaVisualizerData,
			options?: {
				onNodeClick?: (nodeId: string, schema: unknown) => void;
			},
		) => void;
		schemaVisualizerData?: SchemaVisualizerData;
	}
}

// Cache the VSCode API to prevent double-acquisition error
function getVsCodeApi() {
	if (!window.__vscodeApi && window.acquireVsCodeApi) {
		try {
			window.__vscodeApi = window.acquireVsCodeApi();
		} catch {
			// API already acquired, ignore
		}
	}
	return window.__vscodeApi;
}

// Create the render function that will be called from the webview
window.renderSchemaVisualizer = (
	container: HTMLElement,
	data: SchemaVisualizerData,
	options?: {
		onNodeClick?: (nodeId: string, schema: unknown) => void;
	},
) => {
	// Clear any existing content
	container.innerHTML = "";

	// Create a wrapper div with the root class for styling
	const wrapper = document.createElement("div");
	wrapper.className = "schema-visualizer-root";
	wrapper.style.width = "100%";
	wrapper.style.height = "100%";
	container.appendChild(wrapper);

	const root = createRoot(wrapper);

	// Get cached VSCode API if available
	const vscode = getVsCodeApi();

	const handleNodeClick = (nodeId: string, schema: unknown) => {
		// Call the provided callback
		options?.onNodeClick?.(nodeId, schema);

		// Also post message to VSCode if available
		vscode?.postMessage({
			type: "nodeClick",
			nodeId,
			schema,
		});
	};

	root.render(
		<SchemaVisualizer
			data={data}
			onNodeClick={handleNodeClick}
			showBackground={true}
			showNodeDetails={true}
			showToolbar={true}
			showStats={true}
		/>,
	);
};
