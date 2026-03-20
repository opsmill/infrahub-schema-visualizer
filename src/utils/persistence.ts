import type { EdgeStyle } from "../components/toolbar/bottom-toolbar";
import { createLocalStore } from "./local-storage";

export interface PersistedState {
	hiddenNodes: string[];
	edgeStyle: EdgeStyle;
	nodePositions: { id: string; x: number; y: number }[];
	collapsedNodes: string[];
}

export const visualizerStore = createLocalStore<PersistedState>(
	"schema-visualizer-state",
	2,
);
