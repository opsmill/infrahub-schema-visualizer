/**
 * Webview entry point for VSCode extension.
 * This file creates a global function that can be called from the webview HTML
 * to render the SchemaVisualizer component.
 *
 * The bundle is completely self-contained with all styles and dependencies.
 */
import { useSyncExternalStore } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
	SchemaVisualizer,
	type Theme,
} from "./components/graph/schema-visualizer";
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
				theme?: Theme;
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

// VSCode marks its resolved theme on <body> (vscode-light / vscode-dark /
// vscode-high-contrast / vscode-high-contrast-light). Mapping that class is
// still "theme from the embedder": the webview never inspects the OS theme.
function getVsCodeTheme(): Theme {
	const bodyClasses = document.body.classList;
	// High-contrast light themes carry BOTH vscode-high-contrast-light and
	// vscode-high-contrast (VS Code backwards compatibility), so the light
	// variant must be checked first.
	if (bodyClasses.contains("vscode-high-contrast-light")) {
		return "light";
	}
	if (
		bodyClasses.contains("vscode-dark") ||
		bodyClasses.contains("vscode-high-contrast")
	) {
		return "dark";
	}
	return "light";
}

function subscribeToBodyClass(onChange: () => void): () => void {
	const observer = new MutationObserver(onChange);
	observer.observe(document.body, {
		attributes: true,
		attributeFilter: ["class"],
	});
	return () => observer.disconnect();
}

// With an explicit embedder theme the body observer is dead weight; hooks
// must still be called unconditionally, so subscribe to nothing instead.
function subscribeToNothing(): () => void {
	return () => {};
}

function WebviewApp({
	data,
	theme,
	onNodeClick,
}: {
	data: SchemaVisualizerData;
	theme?: Theme;
	onNodeClick: (nodeId: string, schema: unknown) => void;
}) {
	const vsCodeTheme = useSyncExternalStore(
		theme ? subscribeToNothing : subscribeToBodyClass,
		getVsCodeTheme,
	);

	return (
		<SchemaVisualizer
			data={data}
			theme={theme ?? vsCodeTheme}
			onNodeClick={onNodeClick}
			showBackground={true}
			showNodeDetails={true}
			showToolbar={true}
			showStats={true}
		/>
	);
}

// Re-rendering into the same container must unmount the previous React tree,
// otherwise its body-class observer keeps re-rendering a detached graph.
const activeRoots = new WeakMap<HTMLElement, Root>();

// Create the render function that will be called from the webview
window.renderSchemaVisualizer = (
	container: HTMLElement,
	data: SchemaVisualizerData,
	options?: {
		onNodeClick?: (nodeId: string, schema: unknown) => void;
		theme?: Theme;
	},
) => {
	// Clear any existing content
	activeRoots.get(container)?.unmount();
	activeRoots.delete(container);
	container.innerHTML = "";

	// Create a wrapper div with the root class for styling
	const wrapper = document.createElement("div");
	wrapper.className = "schema-visualizer-root";
	wrapper.style.width = "100%";
	wrapper.style.height = "100%";
	container.appendChild(wrapper);

	const root = createRoot(wrapper);
	activeRoots.set(container, root);

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
		<WebviewApp
			data={data}
			theme={options?.theme}
			onNodeClick={handleNodeClick}
		/>,
	);
};
