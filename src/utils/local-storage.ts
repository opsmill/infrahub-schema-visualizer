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

	return { load, save, clear };
}
