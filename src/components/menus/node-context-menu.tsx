import { Icon } from "@iconify-icon/react";
import { useRef } from "react";
import { useDismiss } from "../../hooks/use-dismiss";

export interface NodeContextMenuProps {
	nodeId: string;
	x: number;
	y: number;
	onClose: () => void;
	onSelectConnected: (nodeId: string) => void;
	onSelectNode: (nodeId: string) => void;
	onShowPeers: (nodeId: string) => void;
	onHideNode: (nodeId: string) => void;
	onShowDetails: (nodeId: string) => void;
}

export function NodeContextMenu({
	nodeId,
	x,
	y,
	onClose,
	onSelectConnected,
	onSelectNode,
	onShowPeers,
	onHideNode,
	onShowDetails,
}: NodeContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);

	useDismiss(menuRef, onClose);

	const handleSelectConnected = () => {
		onSelectConnected(nodeId);
		onClose();
	};

	const handleSelectNode = () => {
		onSelectNode(nodeId);
		onClose();
	};

	const handleShowPeers = () => {
		onShowPeers(nodeId);
		onClose();
	};

	const handleHideNode = () => {
		onHideNode(nodeId);
		onClose();
	};

	const handleShowDetails = () => {
		onShowDetails(nodeId);
		onClose();
	};

	return (
		<div
			ref={menuRef}
			className="fixed z-50 min-w-[200px] rounded-lg bg-(--sv-surface) py-1 shadow-lg border border-(--sv-border)"
			style={{ left: x, top: y }}
		>
			<button
				type="button"
				onClick={handleShowDetails}
				className="flex w-full items-center gap-2 px-3 py-2 text-sm text-(--sv-text-2) hover:bg-(--sv-surface-3)"
			>
				<Icon
					icon="mdi:information-outline"
					className="text-lg text-(--sv-text-4)"
				/>
				Show details
			</button>
			<div className="my-1 border-t border-(--sv-border-2)" />
			<button
				type="button"
				onClick={handleSelectNode}
				className="flex w-full items-center gap-2 px-3 py-2 text-sm text-(--sv-text-2) hover:bg-(--sv-surface-3)"
			>
				<Icon icon="mdi:select" className="text-lg text-(--sv-text-4)" />
				Select this node
			</button>
			<button
				type="button"
				onClick={handleSelectConnected}
				className="flex w-full items-center gap-2 px-3 py-2 text-sm text-(--sv-text-2) hover:bg-(--sv-surface-3)"
			>
				<Icon icon="mdi:select-group" className="text-lg text-(--sv-text-4)" />
				Select connected nodes
			</button>
			<div className="my-1 border-t border-(--sv-border-2)" />
			<button
				type="button"
				onClick={handleShowPeers}
				className="flex w-full items-center gap-2 px-3 py-2 text-sm text-(--sv-text-2) hover:bg-(--sv-surface-3)"
			>
				<Icon icon="mdi:eye-outline" className="text-lg text-(--sv-text-4)" />
				Show first-level peers
			</button>
			<button
				type="button"
				onClick={handleHideNode}
				className="flex w-full items-center gap-2 px-3 py-2 text-sm text-(--sv-text-2) hover:bg-(--sv-surface-3)"
			>
				<Icon
					icon="mdi:eye-off-outline"
					className="text-lg text-(--sv-text-4)"
				/>
				Hide this node
			</button>
			<div className="my-1 border-t border-(--sv-border-2)" />
			<div className="px-3 py-1.5 text-xs text-(--sv-text-5)">
				Drag selected nodes to organize
			</div>
		</div>
	);
}
