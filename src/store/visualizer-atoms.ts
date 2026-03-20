import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import type { EdgeStyle } from "../components/toolbar/bottom-toolbar";

// ─── Persisted atoms (auto-sync to localStorage) ────────────────────────

const STORAGE_PREFIX = "schema-visualizer";

export const hiddenNodesAtom = atomWithStorage<string[]>(
	`${STORAGE_PREFIX}:hiddenNodes`,
	[],
);

export const collapsedNodesAtom = atomWithStorage<string[]>(
	`${STORAGE_PREFIX}:collapsedNodes`,
	[],
);

export const edgeStyleAtom = atomWithStorage<EdgeStyle>(
	`${STORAGE_PREFIX}:edgeStyle`,
	"smoothstep",
);

export const nodePositionsAtom = atomWithStorage<
	Record<string, { x: number; y: number }>
>(`${STORAGE_PREFIX}:nodePositions`, {});

export const hasCustomizedViewAtom = atomWithStorage<boolean>(
	`${STORAGE_PREFIX}:hasCustomizedView`,
	false,
);

// ─── Convenience derived atoms (Set wrappers) ───────────────────────────

export const hiddenNodesSetAtom = atom(
	(get) => new Set(get(hiddenNodesAtom)),
	(_get, set, next: Set<string>) => set(hiddenNodesAtom, Array.from(next)),
);

export const collapsedNodesSetAtom = atom(
	(get) => new Set(get(collapsedNodesAtom)),
	(_get, set, next: Set<string>) =>
		set(collapsedNodesAtom, Array.from(next)),
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
