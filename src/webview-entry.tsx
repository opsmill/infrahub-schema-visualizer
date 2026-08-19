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

// VSCode marks its resolved theme on <body>, both as a class and as the
// data-vscode-theme-kind attribute. Mapping that is still "theme from the
// embedder": the webview never inspects the OS theme.
const VSCODE_THEME_KINDS = new Set([
	"vscode-light",
	"vscode-dark",
	"vscode-high-contrast",
	"vscode-high-contrast-light",
]);

export function getVsCodeTheme(): Theme {
	// VSCode only adds the theme class once it knows the theme, but it assigns
	// data-vscode-theme-kind unguarded, so before its first `styles` message the
	// attribute is literally the string "undefined". Check membership rather
	// than nullishness, or the class fallback never runs.
	const kind = document.body.dataset.vscodeThemeKind;
	const themeKind =
		kind && VSCODE_THEME_KINDS.has(kind) ? kind : themeKindFromClasses();

	return themeKind === "vscode-dark" || themeKind === "vscode-high-contrast"
		? "dark"
		: "light";
}

function themeKindFromClasses(): string {
	const bodyClasses = document.body.classList;
	// High-contrast light themes carry BOTH vscode-high-contrast-light and
	// vscode-high-contrast (VS Code backwards compatibility), so the light
	// variant must be checked first.
	if (bodyClasses.contains("vscode-high-contrast-light")) {
		return "vscode-high-contrast-light";
	}
	if (bodyClasses.contains("vscode-dark")) {
		return "vscode-dark";
	}
	if (bodyClasses.contains("vscode-high-contrast")) {
		return "vscode-high-contrast";
	}
	return "vscode-light";
}

function subscribeToBodyTheme(onChange: () => void): () => void {
	const observer = new MutationObserver(onChange);
	observer.observe(document.body, {
		attributes: true,
		attributeFilter: ["class", "data-vscode-theme-kind"],
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
		theme ? subscribeToNothing : subscribeToBodyTheme,
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

// A previous React tree must be unmounted before a new one renders, otherwise
// its body observer keeps re-rendering a detached graph on every theme change.
// Hosts either reuse the container or swap in a fresh one, so match on both:
// the same container, or any container no longer in the document.
const activeRoots = new Map<HTMLElement, Root>();

function unmountSupersededRoots(container: HTMLElement) {
	for (const [mounted, root] of activeRoots) {
		if (mounted === container || !mounted.isConnected) {
			root.unmount();
			activeRoots.delete(mounted);
		}
	}
}

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
	unmountSupersededRoots(container);
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
