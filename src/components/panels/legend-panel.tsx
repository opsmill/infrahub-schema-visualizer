import { Icon } from "@iconify-icon/react";
import { Panel } from "@xyflow/react";
import { useState } from "react";

export function LegendPanel() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			{/* Help button */}
			<Panel position="top-right" className="mr-2 mt-2">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
					title="Show legend"
				>
					<Icon icon="mdi:help-circle-outline" className="text-xl" />
				</button>
			</Panel>

			{/* Legend popup */}
			{isOpen && (
				<Panel position="top-right" className="mr-2 mt-12">
					<div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[280px] max-w-[320px]">
						<div className="flex items-center justify-between mb-3">
							<h3 className="font-semibold text-sm text-gray-700">Legend</h3>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								<Icon icon="mdi:close" className="text-lg" />
							</button>
						</div>

						{/* Schema Types */}
						<div className="mb-4">
							<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
								Schema Types
							</h4>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 rounded bg-[#087895]" />
									<span className="text-xs text-gray-600">Node</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 rounded bg-[#7F22FE]" />
									<span className="text-xs text-gray-600">Profile</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 rounded bg-[#F54900]" />
									<span className="text-xs text-gray-600">Template</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 rounded bg-[#009966]" />
									<span className="text-xs text-gray-600">Generic</span>
								</div>
							</div>
						</div>

						{/* Edge Colors */}
						<div className="mb-4">
							<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
								Edge Colors
							</h4>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<div className="w-8 h-0.5 bg-[#087895]" />
									<span className="text-xs text-gray-600">
										Node relationship
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-8 h-0.5 bg-[#7F22FE]" />
									<span className="text-xs text-gray-600">
										Profile relationship
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-8 h-0.5 bg-[#F54900]" />
									<span className="text-xs text-gray-600">
										Template relationship
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-8 h-0.5 bg-[#009966]" />
									<span className="text-xs text-gray-600">
										Inherited relationship
									</span>
								</div>
							</div>
						</div>

						{/* Line Styles */}
						<div className="mb-4">
							<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
								Line Styles
							</h4>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<div className="w-8 h-0.5 bg-[#087895]" />
									<span className="text-xs text-gray-600">
										Solid - One cardinality
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className="w-8 h-0.5 relative overflow-hidden"
										style={{ background: "#087895" }}
									>
										<div
											className="absolute inset-0"
											style={{
												backgroundImage:
													"repeating-linear-gradient(90deg, transparent, transparent 2px, #087895 2px, #087895 6px)",
												animation: "dash-move 0.5s linear infinite",
											}}
										/>
									</div>
									<span className="text-xs text-gray-600">
										Animated - Many cardinality
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className="w-8 h-0.5"
										style={{
											backgroundImage:
												"repeating-linear-gradient(90deg, #009966, #009966 3px, transparent 3px, transparent 6px)",
										}}
									/>
									<span className="text-xs text-gray-600">
										Dashed green - Via generic
									</span>
								</div>
							</div>
						</div>

						{/* Special Markers */}
						<div className="mb-4">
							<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
								Special Markers
							</h4>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<span className="text-orange-500 flex items-center gap-0.5">
										<Icon icon="mdi:reload" className="text-sm" />
									</span>
									<span className="text-xs text-gray-600">
										Self-referencing relationship
									</span>
								</div>
							</div>
						</div>

						{/* Tips */}
						<div className="border-t border-gray-100 pt-3">
							<h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
								Tips
							</h4>
							<ul className="text-xs text-gray-600 space-y-1">
								<li className="flex items-start gap-1">
									<Icon
										icon="mdi:circle-small"
										className="text-gray-400 shrink-0 mt-0.5"
									/>
									<span>Hover over a node to highlight connections</span>
								</li>
								<li className="flex items-start gap-1">
									<Icon
										icon="mdi:circle-small"
										className="text-gray-400 shrink-0 mt-0.5"
									/>
									<span>Right-click a node for more options</span>
								</li>
								<li className="flex items-start gap-1">
									<Icon
										icon="mdi:circle-small"
										className="text-gray-400 shrink-0 mt-0.5"
									/>
									<span>Drag to select multiple nodes</span>
								</li>
							</ul>
						</div>
					</div>
				</Panel>
			)}
		</>
	);
}
