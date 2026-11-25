import type { CategoryRecord, ModuleRecord, RuntimeRegistry } from "./types";

/**
 * Derived coverage summary. It is generated from the runtime registry so an
 * additive extension automatically appears in coverage reporting.
 */
export interface CoverageRow {
  id: string;
  label: string;
  depth: number;
  path: string[];
  leafPlacements: number;
  moduleIds: string[];
}

export interface CoverageSummary {
  counts: RuntimeRegistry["counts"];
  categories: CoverageRow[];
  moduleIds: string[];
  hasExtensions: boolean;
}

export function buildCoverageSummary(
  registry: RuntimeRegistry,
  resolveStatus: (moduleId: string) => string = () => "planned",
): CoverageSummary & { statuses: Record<string, string> } {
  const moduleById = new Map<string, ModuleRecord>(
    registry.modules.map((record) => [record.id, record]),
  );
  const rows: CoverageRow[] = registry.categories.map((category: CategoryRecord) => {
    const moduleIds = registry.placements
      .filter((placement) => placement.categoryId === category.id)
      .map((placement) => placement.moduleId);
    return {
      id: category.id,
      label: category.label,
      depth: category.depth,
      path: category.path.map((item) => item.label),
      leafPlacements: moduleIds.length,
      moduleIds,
    };
  });
  const statuses: Record<string, string> = {};
  for (const record of moduleById.values()) {
    statuses[record.id] = resolveStatus(record.id);
  }
  return {
    counts: registry.counts,
    categories: rows,
    moduleIds: registry.modules.map((record) => record.id),
    hasExtensions: registry.hasExtensions,
    statuses,
  };
}
