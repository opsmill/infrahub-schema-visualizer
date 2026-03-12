import { Icon } from "@iconify-icon/react";
import { Panel, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
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

	const handleExport = useCallback(
		(format: ExportFormat) => {
			onExport(format);
			setExportMenuOpen(false);
		},
		[onExport],
	);

	// Close export menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				exportMenuRef.current &&
				!exportMenuRef.current.contains(event.target as Node)
			) {
				setExportMenuOpen(false);
			}
		};

		if (exportMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => {
				document.removeEventListener("mousedown", handleClickOutside);
			};
		}
	}, [exportMenuOpen]);

	return (
		<Panel
			position="bottom-center"
			className="mb-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-lg"
		>
			<button
				type="button"
				onClick={() => zoomOut()}
				className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 text-gray-600"
				title="Zoom out"
			>
				<Icon icon="mdi:minus" className="text-lg" />
			</button>
			<button
				type="button"
				onClick={() => fitView({ padding: 0.2 })}
				className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 text-gray-600"
				title="Fit to screen"
			>
				<Icon icon="mdi:fit-to-screen" className="text-lg" />
			</button>
			<button
				type="button"
				onClick={() => zoomIn()}
				className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 text-gray-600"
				title="Zoom in"
			>
				<Icon icon="mdi:plus" className="text-lg" />
			</button>
			<div className="mx-2 h-6 w-px bg-gray-200" />
			<button
				type="button"
				onClick={() =>
					onEdgeStyleChange(edgeStyle === "bezier" ? "smoothstep" : "bezier")
				}
				className="flex h-8 items-center justify-center gap-1.5 rounded px-2 hover:bg-gray-100 text-gray-600"
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
			<div className="mx-2 h-6 w-px bg-gray-200" />
			<button
				type="button"
				onClick={() => onLayout("LR")}
				className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 text-gray-600"
				title="Auto-layout horizontal"
			>
				<Icon icon="mdi:arrow-right" className="text-lg" />
			</button>
			<button
				type="button"
				onClick={() => onLayout("TB")}
				className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 text-gray-600"
				title="Auto-layout vertical"
			>
				<Icon icon="mdi:arrow-down" className="text-lg" />
			</button>
			<div className="mx-2 h-6 w-px bg-gray-200" />
			<button
				type="button"
				onClick={onFilterClick}
				className={cn(
					"flex h-8 w-8 items-center justify-center rounded",
					isFilterOpen
						? "bg-indigo-500 text-white hover:bg-indigo-600"
						: "hover:bg-gray-100 text-gray-600",
				)}
				title="Filter nodes"
			>
				<Icon icon="mdi:filter-variant" className="text-lg" />
			</button>
			{showReset && onReset && (
				<button
					type="button"
					onClick={onReset}
					className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 text-gray-600"
					title="Reset to default view"
				>
					<Icon icon="mdi:refresh" className="text-lg" />
				</button>
			)}
			<div className="mx-2 h-6 w-px bg-gray-200" />
			<div className="relative" ref={exportMenuRef}>
				<button
					type="button"
					onClick={() => setExportMenuOpen(!exportMenuOpen)}
					className={cn(
						"flex h-8 w-8 items-center justify-center rounded",
						exportMenuOpen
							? "bg-indigo-500 text-white hover:bg-indigo-600"
							: "hover:bg-gray-100 text-gray-600",
					)}
					title="Export diagram"
				>
					<Icon icon="mdi:download" className="text-lg" />
				</button>
				{exportMenuOpen && (
					<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[120px] rounded-lg bg-white py-1 shadow-lg border border-gray-200">
						<button
							type="button"
							onClick={() => handleExport("png")}
							className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
						>
							<Icon
								icon="mdi:image-outline"
								className="text-lg text-gray-500"
							/>
							PNG
						</button>
						<button
							type="button"
							onClick={() => handleExport("svg")}
							className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
						>
							<Icon
								icon="mdi:file-code-outline"
								className="text-lg text-gray-500"
							/>
							SVG
						</button>
					</div>
				)}
			</div>
		</Panel>
	);
}
