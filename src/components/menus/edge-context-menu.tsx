import { Icon } from "@iconify-icon/react";
import { useRef, useState } from "react";
import { useDismiss } from "../../hooks/use-dismiss";

export interface EdgeInfo {
	id: string;
	source: string;
	target: string;
	sourceRelName: string;
	targetRelName: string | null;
	cardinality: "one" | "many";
}

export interface EdgeContextMenuProps {
	edge: EdgeInfo;
	x: number;
	y: number;
	onClose: () => void;
	onHighlight: (edgeId: string) => void;
}

export function EdgeContextMenu({
	edge,
	x,
	y,
	onClose,
	onHighlight,
}: EdgeContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);
	const [copied, setCopied] = useState(false);

	useDismiss(menuRef, onClose);

	const handleHighlight = () => {
		onHighlight(edge.id);
		onClose();
	};

	const handleCopyInfo = async () => {
		const info = [
			`Relationship: ${edge.sourceRelName}`,
			`From: ${edge.source}`,
			`To: ${edge.target}`,
			`Cardinality: ${edge.cardinality}`,
			edge.targetRelName ? `Reverse: ${edge.targetRelName}` : null,
		]
			.filter(Boolean)
			.join("\n");

		try {
			// Try the modern clipboard API first
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(info);
			} else {
				// Fallback for environments without clipboard API
				const textArea = document.createElement("textarea");
				textArea.value = info;
				textArea.style.position = "fixed";
				textArea.style.left = "-9999px";
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand("copy");
				document.body.removeChild(textArea);
			}
			setCopied(true);
			setTimeout(() => {
				setCopied(false);
				onClose();
			}, 1000);
		} catch (err) {
			console.error("Failed to copy:", err);
			// Still show feedback even if copy failed
			onClose();
		}
	};

	return (
		<div
			ref={menuRef}
			className="fixed z-50 min-w-[220px] rounded-lg bg-(--sv-surface) py-1 shadow-lg border border-(--sv-border)"
			style={{ left: x, top: y }}
		>
			{/* Edge info header */}
			<div className="px-3 py-2 border-b border-(--sv-border-2)">
				<div className="text-xs font-medium text-(--sv-text-2) truncate">
					{edge.sourceRelName}
				</div>
				<div className="text-[10px] text-(--sv-text-5) mt-0.5">
					{edge.source} → {edge.target}
				</div>
			</div>

			<button
				type="button"
				onClick={handleHighlight}
				className="flex w-full items-center gap-2 px-3 py-2 text-sm text-(--sv-text-2) hover:bg-(--sv-surface-3)"
			>
				<Icon
					icon="mdi:spotlight-beam"
					className="text-lg text-(--sv-text-4)"
				/>
				Highlight relationship
			</button>
			<div className="my-1 border-t border-(--sv-border-2)" />
			<button
				type="button"
				onClick={handleCopyInfo}
				className="flex w-full items-center gap-2 px-3 py-2 text-sm text-(--sv-text-2) hover:bg-(--sv-surface-3)"
			>
				<Icon
					icon={copied ? "mdi:check" : "mdi:content-copy"}
					className={`text-lg ${copied ? "text-(--sv-success)" : "text-(--sv-text-4)"}`}
				/>
				{copied ? "Copied!" : "Copy relationship info"}
			</button>
		</div>
	);
}
