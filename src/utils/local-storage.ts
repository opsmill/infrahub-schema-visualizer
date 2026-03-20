/**
 * Generic, versioned localStorage wrapper.
 *
 * Each store gets its own key and version number.
 * On version mismatch the stored data is discarded.
 */

interface StoredEnvelope<T> {
	version: number;
	data: T;
}

export interface LocalStore<T> {
	load(): T | null;
	save(data: T): void;
	clear(): void;
	/** Read a single field without loading the entire blob. */
	get<K extends keyof T>(key: K): T[K] | undefined;
	/** Patch one or more fields and persist. */
	patch(partial: Partial<T>): void;
}

export function createLocalStore<T>(
	key: string,
	version: number,
): LocalStore<T> {
	function load(): T | null {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) return null;
			const envelope = JSON.parse(raw) as StoredEnvelope<T>;
			if (envelope.version !== version) {
				localStorage.removeItem(key);
				return null;
			}
			return envelope.data;
		} catch {
			localStorage.removeItem(key);
			return null;
		}
	}

	function save(data: T): void {
		try {
			const envelope: StoredEnvelope<T> = { version, data };
			localStorage.setItem(key, JSON.stringify(envelope));
		} catch {
			// Silently fail if localStorage is not available
		}
	}

	function clear(): void {
		try {
			localStorage.removeItem(key);
		} catch {
			// Silently fail if localStorage is not available
		}
	}

	function get<K extends keyof T>(field: K): T[K] | undefined {
		const state = load();
		return state?.[field];
	}

	function patch(partial: Partial<T>): void {
		const current = load();
		save({ ...({} as T), ...current, ...partial });
	}

	return { load, save, clear, get, patch };
}
