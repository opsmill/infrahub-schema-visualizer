import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

// Configuration for building a webview bundle for VSCode extension
// This creates a self-contained bundle with React, styles, and icons included
export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		tailwindcss(),
	],
	define: {
		"process.env.NODE_ENV": JSON.stringify("production"),
	},
	build: {
		outDir: "dist/webview",
		lib: {
			entry: resolve(__dirname, "src/webview-entry.tsx"),
			name: "SchemaVisualizer",
			formats: ["iife"],
			fileName: () => "schema-visualizer.js",
		},
		rollupOptions: {
			// Bundle everything - no externals
			external: [],
			output: {
				globals: {},
				// Output CSS with consistent name
				assetFileNames: (assetInfo) => {
					if (assetInfo.name?.endsWith(".css")) {
						return "schema-visualizer.css";
					}
					return assetInfo.name ?? "asset";
				},
				// Ensure everything is inlined
				inlineDynamicImports: true,
			},
		},
		target: "es2020",
		minify: true,
		cssCodeSplit: false,
		// Increase chunk size warning limit since we're bundling everything
		chunkSizeWarningLimit: 1000,
	},
	// Optimize deps to ensure they're bundled
	optimizeDeps: {
		include: [
			"react",
			"react-dom",
			"@xyflow/react",
			"@iconify-icon/react",
			"@dagrejs/dagre",
			"clsx",
			"tailwind-merge",
			"html-to-image",
		],
	},
});
