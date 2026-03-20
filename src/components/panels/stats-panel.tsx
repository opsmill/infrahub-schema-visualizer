import { Panel } from "@xyflow/react";

import type { SchemaVisualizerData } from "../../types/schema";

interface StatsPanelProps {
	data: SchemaVisualizerData;
	visibleCount: number;
	totalCount: number;
}

export function StatsPanel({
	data,
	visibleCount,
	totalCount,
}: StatsPanelProps) {
	return (
		<Panel position="top-left" className="rounded-lg bg-white p-3 shadow-md">
			<div className="text-sm">
				<div className="mb-2 font-semibold text-gray-700">Schema Overview</div>
				<div className="space-y-1 text-gray-600">
					<StatRow label="Visible" value={visibleCount} />
					<StatRow label="Total" value={totalCount} />
					<StatRow label="Nodes" value={data.nodes.length} />
					{(data.profiles?.length ?? 0) > 0 && (
						<StatRow label="Profiles" value={data.profiles?.length ?? 0} />
					)}
					{(data.templates?.length ?? 0) > 0 && (
						<StatRow label="Templates" value={data.templates?.length ?? 0} />
					)}
					<StatRow label="Generics" value={data.generics.length} />
				</div>
			</div>
		</Panel>
	);
}

function StatRow({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex justify-between gap-4">
			<span>{label}:</span>
			<span className="font-medium">{value}</span>
		</div>
	);
}
