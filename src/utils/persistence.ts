import type { EdgeStyle } from "../components/toolbar/bottom-toolbar";
import { createLocalStore } from "./local-storage";

export interface NodePosition {
	id: string;
	x: number;
	y: number;
}

export interface PersistedState {
	hiddenNodes: string[];
	edgeStyle: EdgeStyle;
	nodePositions: NodePosition[];
	collapsedNodes: string[];
}

const CURRENT_VERSION = 2;

export const visualizerStore = createLocalStore<PersistedState>(
	"schema-visualizer-state",
	CURRENT_VERSION,
);

// Convenience aliases for backward compatibility
export const loadPersistedState = visualizerStore.load;
export const savePersistedState = (state: Omit<PersistedState, "version">): void =>
	visualizerStore.save(state as PersistedState);
export const clearPersistedState = visualizerStore.clear;
