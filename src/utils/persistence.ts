import type { EdgeStyle } from "../components/toolbar/bottom-toolbar";

const STORAGE_KEY = "schema-visualizer-state";

export interface NodePosition {
	id: string;
	x: number;
	y: number;
}

export interface PersistedState {
	hiddenNodes: string[];
	edgeStyle: EdgeStyle;
	nodePositions: NodePosition[];
	version: number;
}

const CURRENT_VERSION = 1;

export function loadPersistedState(): PersistedState | null {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return null;

		const parsed = JSON.parse(stored) as PersistedState;

		// Reset on version mismatch - no migrations needed
		if (parsed.version !== CURRENT_VERSION) {
			localStorage.removeItem(STORAGE_KEY);
			return null;
		}

		return parsed;
	} catch {
		// On any error, clear storage and return null
		localStorage.removeItem(STORAGE_KEY);
		return null;
	}
}

export function savePersistedState(
	state: Omit<PersistedState, "version">,
): void {
	try {
		const toStore: PersistedState = {
			...state,
			version: CURRENT_VERSION,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
	} catch {
		// Silently fail if localStorage is not available
	}
}

export function clearPersistedState(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Silently fail if localStorage is not available
	}
}

