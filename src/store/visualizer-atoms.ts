import { atom } from "jotai";

import type { EdgeStyle } from "../components/toolbar/bottom-toolbar";

// ─── localStorage helpers ───────────────────────────────────────────────

const STORAGE_PREFIX = "schema-visualizer";

function loadFromStorage<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(`${STORAGE_PREFIX}:${key}`);
		if (raw === null) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

function saveToStorage<T>(key: string, value: T): void {
	try {
		localStorage.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(value));
	} catch {
		// silently fail
	}
}

function removeFromStorage(key: string): void {
	try {
		localStorage.removeItem(`${STORAGE_PREFIX}:${key}`);
	} catch {
		// silently fail
	}
}

// ─── Helper: create an atom that syncs writes to localStorage ───────────

function atomWithLocalStorage<T>(key: string, fallback: T) {
	const base = atom<T>(loadFromStorage(key, fallback));
	return atom(
		(get) => get(base),
		(_get, set, next: T) => {
			set(base, next);
			saveToStorage(key, next);
		},
	);
}

// ─── Persisted atoms (sync read from localStorage on init) ──────────────

export const hiddenNodesAtom = atomWithLocalStorage<string[]>(
	"hiddenNodes",
	[],
);

export const collapsedNodesAtom = atomWithLocalStorage<string[]>(
	"collapsedNodes",
	[],
);

export const edgeStyleAtom = atomWithLocalStorage<EdgeStyle>(
	"edgeStyle",
	"smoothstep",
);

export const nodePositionsAtom = atomWithLocalStorage<
	Record<string, { x: number; y: number }>
>("nodePositions", {});

export const hasCustomizedViewAtom = atomWithLocalStorage<boolean>(
	"hasCustomizedView",
	false,
);

export const viewportAtom = atomWithLocalStorage<{
	x: number;
	y: number;
	zoom: number;
} | null>("viewport", null);

// ─── Convenience derived atoms (Set/Map wrappers) ───────────────────────

export const hiddenNodesSetAtom = atom(
	(get) => new Set(get(hiddenNodesAtom)),
	(_get, set, next: Set<string>) => set(hiddenNodesAtom, Array.from(next)),
);

export const collapsedNodesSetAtom = atom(
	(get) => new Set(get(collapsedNodesAtom)),
	(_get, set, next: Set<string>) => set(collapsedNodesAtom, Array.from(next)),
);

export const nodePositionsMapAtom = atom(
	(get) => {
		const record = get(nodePositionsAtom);
		return new Map(Object.entries(record));
	},
	(_get, set, next: Map<string, { x: number; y: number }>) => {
		set(nodePositionsAtom, Object.fromEntries(next));
	},
);

export function clearAllStorage(): void {
	removeFromStorage("hiddenNodes");
	removeFromStorage("collapsedNodes");
	removeFromStorage("edgeStyle");
	removeFromStorage("nodePositions");
	removeFromStorage("hasCustomizedView");
	removeFromStorage("viewport");
}
