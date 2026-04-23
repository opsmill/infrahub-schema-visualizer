import type { BaseSchema } from "../types/schema";

export function getSchemaIcon(
	schema: Pick<BaseSchema, "icon"> | null | undefined,
): string {
	if (!schema?.icon) return "mdi:cube-outline";
	return schema.icon;
}
