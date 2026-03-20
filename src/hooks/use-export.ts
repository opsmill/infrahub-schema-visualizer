import { getNodesBounds, getViewportForBounds, type Node } from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";

import type { ExportFormat } from "../components/toolbar/bottom-toolbar";

export function exportGraph(flowNodes: Node[], format: ExportFormat) {
	const viewport = document.querySelector(
		".react-flow__viewport",
	) as HTMLElement;
	if (!viewport) {
		console.warn("exportGraph: could not find .react-flow__viewport element");
		return;
	}

	const nodesBounds = getNodesBounds(flowNodes);
	const padding = 50;
	const imageWidth = nodesBounds.width + padding * 2;
	const imageHeight = nodesBounds.height + padding * 2;

	const viewportForBounds = getViewportForBounds(
		nodesBounds,
		imageWidth,
		imageHeight,
		0.5,
		2,
		0,
	);

	const exportOptions = {
		backgroundColor: "#f8fafc",
		width: imageWidth,
		height: imageHeight,
		style: {
			width: `${imageWidth}px`,
			height: `${imageHeight}px`,
			transform: `translate(${viewportForBounds.x}px, ${viewportForBounds.y}px) scale(${viewportForBounds.zoom})`,
		},
	};

	const downloadFile = (dataUrl: string, extension: string) => {
		const link = document.createElement("a");
		link.download = `schema-graph.${extension}`;
		link.href = dataUrl;
		link.click();
	};

	if (format === "png") {
		toPng(viewport, exportOptions).then((dataUrl) => {
			downloadFile(dataUrl, "png");
		});
	} else {
		toSvg(viewport, exportOptions).then((dataUrl) => {
			downloadFile(dataUrl, "svg");
		});
	}
}
