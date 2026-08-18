import { Icon } from "@iconify-icon/react";
import { Panel, useReactFlow } from "@xyflow/react";
import { useRef, useState } from "react";
import { useDismiss } from "../../hooks/use-dismiss";
import { cn } from "../../utils/cn";

export type EdgeStyle = "bezier" | "smoothstep";
export type LayoutDirection = "TB" | "LR";
export type ExportFormat = "png" | "svg";

export interface BottomToolbarProps {
	onFilterClick: () => void;
	isFilterOpen: boolean;
	edgeStyle: EdgeStyle;
	onEdgeStyleChange: (style: EdgeStyle) => void;
	onLayout: (direction: LayoutDirection) => void;
	onExport: (format: ExportFormat) => void;
	onReset?: () => void;
	showReset?: boolean;
}

export function BottomToolbar({
	onFilterClick,
	isFilterOpen,
	edgeStyle,
	onEdgeStyleChange,
	onLayout,
	onExport,
	onReset,
	showReset = false,
}: BottomToolbarProps) {
	const { zoomIn, zoomOut, fitView } = useReactFlow();
	const [exportMenuOpen, setExportMenuOpen] = useState(false);
	const exportMenuRef = useRef<HTMLDivElement>(null);

	const handleExport = (format: ExportFormat) => {
		onExport(format);
		setExportMenuOpen(false);
	};

	const closeExportMenu = () => setExportMenuOpen(false);
	useDismiss(exportMenuRef, closeExportMenu, exportMenuOpen);

	return (
		<Panel
			position="bottom-center"
			className="mb-4 flex items-center gap-2 rounded-lg bg-(--sv-surface) px-3 py-2 shadow-lg"
		>
			<button
				type="button"
				onClick={() => zoomOut()}
				className="flex h-8 w-8 items-center justify-center rounded hover:bg-(--sv-surface-3) text-(--sv-text-3)"
				title="Zoom out"
			>
				<Icon icon="mdi:minus" className="text-lg" />
			</button>
			<button
				type="button"
				onClick={() => fitView({ padding: 0.2 })}
				className="flex h-8 w-8 items-center justify-center rounded hover:bg-(--sv-surface-3) text-(--sv-text-3)"
				title="Fit to screen"
			>
				<Icon icon="mdi:fit-to-screen" className="text-lg" />
			</button>
			<button
				type="button"
				onClick={() => zoomIn()}
				className="flex h-8 w-8 items-center justify-center rounded hover:bg-(--sv-surface-3) text-(--sv-text-3)"
				title="Zoom in"
			>
				<Icon icon="mdi:plus" className="text-lg" />
			</button>
			<div className="mx-2 h-6 w-px bg-(--sv-surface-4)" />
			<button
				type="button"
				onClick={() =>
					onEdgeStyleChange(edgeStyle === "bezier" ? "smoothstep" : "bezier")
				}
				className="flex h-8 items-center justify-center gap-1.5 rounded px-2 hover:bg-(--sv-surface-3) text-(--sv-text-3)"
				title={`Switch to ${edgeStyle === "bezier" ? "step" : "smooth"} edges`}
			>
				<Icon
					icon={
						edgeStyle === "bezier" ? "mdi:vector-curve" : "mdi:vector-polyline"
					}
					className="text-lg"
				/>
				<span className="text-xs">
					{edgeStyle === "bezier" ? "Smooth" : "Step"}
				</span>
			</button>
			<div className="mx-2 h-6 w-px bg-(--sv-surface-4)" />
			<button
				type="button"
				onClick={() => onLayout("LR")}
				className="flex h-8 w-8 items-center justify-center rounded hover:bg-(--sv-surface-3) text-(--sv-text-3)"
				title="Auto-layout horizontal"
			>
				<Icon icon="mdi:arrow-right" className="text-lg" />
			</button>
			<button
				type="button"
				onClick={() => onLayout("TB")}
				className="flex h-8 w-8 items-center justify-center rounded hover:bg-(--sv-surface-3) text-(--sv-text-3)"
				title="Auto-layout vertical"
			>
				<Icon icon="mdi:arrow-down" className="text-lg" />
			</button>
			<div className="mx-2 h-6 w-px bg-(--sv-surface-4)" />
			<button
				type="button"
				onClick={onFilterClick}
				className={cn(
					"flex h-8 w-8 items-center justify-center rounded",
					isFilterOpen
						? "bg-(--sv-accent) text-white hover:bg-(--sv-accent-strong)"
						: "hover:bg-(--sv-surface-3) text-(--sv-text-3)",
				)}
				title="Filter nodes"
			>
				<Icon icon="mdi:filter-variant" className="text-lg" />
			</button>
			{showReset && onReset && (
				<button
					type="button"
					onClick={onReset}
					className="flex h-8 w-8 items-center justify-center rounded hover:bg-(--sv-surface-3) text-(--sv-text-3)"
					title="Reset to default view"
				>
					<Icon icon="mdi:refresh" className="text-lg" />
				</button>
			)}
			<div className="mx-2 h-6 w-px bg-(--sv-surface-4)" />
			<div className="relative" ref={exportMenuRef}>
				<button
					type="button"
					onClick={() => setExportMenuOpen(!exportMenuOpen)}
					className={cn(
						"flex h-8 w-8 items-center justify-center rounded",
						exportMenuOpen
							? "bg-(--sv-accent) text-white hover:bg-(--sv-accent-strong)"
							: "hover:bg-(--sv-surface-3) text-(--sv-text-3)",
					)}
					title="Export diagram"
				>
					<Icon icon="mdi:download" className="text-lg" />
				</button>
				{exportMenuOpen && (
					<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[120px] rounded-lg bg-(--sv-surface) py-1 shadow-lg border border-(--sv-border)">
						<button
							type="button"
							onClick={() => handleExport("png")}
							className="flex w-full items-center gap-2 px-3 py-2 text-sm text-(--sv-text-2) hover:bg-(--sv-surface-3)"
						>
							<Icon
								icon="mdi:image-outline"
								className="text-lg text-(--sv-text-4)"
							/>
							PNG
						</button>
						<button
							type="button"
							onClick={() => handleExport("svg")}
							className="flex w-full items-center gap-2 px-3 py-2 text-sm text-(--sv-text-2) hover:bg-(--sv-surface-3)"
						>
							<Icon
								icon="mdi:file-code-outline"
								className="text-lg text-(--sv-text-4)"
							/>
							SVG
						</button>
					</div>
				)}
			</div>
		</Panel>
	);
}
