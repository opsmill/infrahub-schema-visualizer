import { type RefObject, useEffect } from "react";

/**
 * Dismisses an element when clicking outside or pressing Escape.
 * Attaches listeners only while active.
 */
export function useDismiss(
	ref: RefObject<HTMLElement | null>,
	onDismiss: () => void,
	active = true,
) {
	useEffect(() => {
		if (!active) return;

		const handlePointerDown = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				onDismiss();
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onDismiss();
			}
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [ref, onDismiss, active]);
}
