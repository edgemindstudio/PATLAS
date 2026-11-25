import {
  REQUIRED_COUNTS,
  validateRegistrySource,
} from "./validate";
import {
  type CategoryRecord,
  type ModuleLifecycleStatus,
  type ModuleRecord,
  type PlacementRecord,
  type Projection,
  type ProjectionCategory,
  type ProjectionPlacement,
  type RegistryCounts,
  type RegistryExtension,
  type RuntimeRegistry,
  type ScopeBaseline,
  type ScopeBaselineModule,
  RegistryValidationError,
} from "./types";

export const PROVISIONAL_NOTICE =
  "Canonical identities are provisional. The frozen baseline placements are preserved " +
  "verbatim; alias reconciliation awaits scientific review.";

export interface RuntimeBuildOptions {
  baselineDigest: string;
  /** Overrides for the projection status used in UI notices. */
  projectionStatus?: "proposal" | "approved";
  /** Test-only additive extension. Production never supplies one. */
  extension?: RegistryExtension;
}

function validateExtension(
  categories: ProjectionCategory[],
  modules: ScopeBaselineModule[],
  placements: ProjectionPlacement[],
  extension: RegistryExtension,
): RegistryValidationError | undefined {
  const issues: Array<{ code: string; message: string }> = [];
  const categoryIds = new Set(categories.map((category) => category.id));
  const moduleIds = new Set(modules.map((record) => record.id));
  const placementIds = new Set(placements.map((placement) => placement.id));

  const seenSiblingOrders = new Map<string, Set<number>>();
  for (const category of categories) {
    const orders = seenSiblingOrders.get(category.parent) ?? new Set<number>();
    orders.add(category.order);
    seenSiblingOrders.set(category.parent, orders);
  }

  for (const category of extension.categories ?? []) {
    if (categoryIds.has(category.id)) {
      issues.push({
        code: "extension-duplicate-category",
        message: `Extension category "${category.id}" collides with an existing category`,
      });
    }
    if (category.parent !== "root" && !categoryIds.has(category.parent)) {
      issues.push({
        code: "extension-unknown-parent",
        message: `Extension category "${category.id}" references unknown parent "${category.parent}"`,
      });
    }
    const orders = seenSiblingOrders.get(category.parent) ?? new Set<number>();
    if (orders.has(category.order)) {
      issues.push({
        code: "extension-duplicate-order",
        message: `Extension category "${category.id}" reuses order ${category.order}`,
      });
    }
    orders.add(category.order);
    seenSiblingOrders.set(category.parent, orders);
    categoryIds.add(category.id);
  }

  for (const record of extension.modules ?? []) {
    if (moduleIds.has(record.id)) {
      issues.push({
        code: "extension-duplicate-module",
        message: `Extension module "${record.id}" collides with an existing module`,
      });
    }
    moduleIds.add(record.id);
  }

  const placementOrders = new Map<string, Set<number>>();
  for (const placement of placements) {
    const orders = placementOrders.get(placement.category_id) ?? new Set<number>();
    orders.add(placement.order);
    placementOrders.set(placement.category_id, orders);
  }

  for (const placement of extension.placements ?? []) {
    if (placementIds.has(placement.id)) {
      issues.push({
        code: "extension-duplicate-placement",
        message: `Extension placement "${placement.id}" collides with an existing placement`,
      });
    }
    placementIds.add(placement.id);
    if (!categoryIds.has(placement.category_id)) {
      issues.push({
        code: "extension-unknown-placement-category",
        message: `Extension placement "${placement.id}" references unknown category`,
      });
    }
    if (!moduleIds.has(placement.module_id)) {
      issues.push({
        code: "extension-unknown-placement-module",
        message: `Extension placement "${placement.id}" references unknown module`,
      });
    }
    const orders = placementOrders.get(placement.category_id) ?? new Set<number>();
    if (orders.has(placement.order)) {
      issues.push({
        code: "extension-duplicate-placement-order",
        message: `Extension placement "${placement.id}" reuses order ${placement.order}`,
      });
    }
    orders.add(placement.order);
    placementOrders.set(placement.category_id, orders);
  }

  return issues.length > 0 ? new RegistryValidationError(issues) : undefined;
}

/**
 * Build the runtime registry. Throws RegistryValidationError with the complete
 * issue list rather than returning partially valid data.
 */
export function buildRuntimeRegistry(
  baseline: ScopeBaseline,
  projection: Projection,
  options: RuntimeBuildOptions,
): RuntimeRegistry {
  const issues = validateRegistrySource(baseline, projection, {
    baselineDigest: options.baselineDigest,
  });
  if (issues.length > 0) throw new RegistryValidationError(issues);

  const categories: ProjectionCategory[] = [...projection.categories];
  const placementsSource: ProjectionPlacement[] = [...projection.placements];
  const modulesSource: ScopeBaselineModule[] = [...projection.modules];
  const extension = options.extension;
  const hasExtensions = Boolean(
    extension &&
      ((extension.categories?.length ?? 0) > 0 ||
        (extension.modules?.length ?? 0) > 0 ||
        (extension.placements?.length ?? 0) > 0),
  );

  if (extension && hasExtensions) {
    const extensionError = validateExtension(
      projection.categories,
      projection.modules,
      projection.placements,
      extension,
    );
    if (extensionError) throw extensionError;
    categories.push(...(extension.categories ?? []));
    modulesSource.push(...(extension.modules ?? []));
    placementsSource.push(...(extension.placements ?? []));
  }

  const categoryById = new Map<string, CategoryRecord>();

  const categoryPath = (id: string): Array<{ id: string; label: string }> => {
    const chain: Array<{ id: string; label: string }> = [];
    let cursor: string | undefined = id;
    const seen = new Set<string>();
    while (cursor && cursor !== "root" && !seen.has(cursor)) {
      seen.add(cursor);
      const category = categoryById.get(cursor);
      if (!category) break;
      chain.unshift({ id: category.id, label: category.label });
      cursor = category.parentId;
    }
    return chain;
  };

  const placementsByCategory = new Map<string, PlacementRecord[]>();
  const placements: PlacementRecord[] = placementsSource.map((placement) => {
    const category = categories.find((c) => c.id === placement.category_id);
    if (!category) {
      // Defensive: validation above guarantees this cannot happen.
      throw new Error(`Missing category ${placement.category_id}`);
    }
    const record: PlacementRecord = {
      id: placement.id,
      categoryId: placement.category_id,
      moduleId: placement.module_id,
      label: placement.label,
      order: placement.order,
      categoryPath: [],
    };
    const bucket = placementsByCategory.get(placement.category_id) ?? [];
    bucket.push(record);
    placementsByCategory.set(placement.category_id, bucket);
    return record;
  });

  for (const category of categories) {
    const bucket = placementsByCategory.get(category.id) ?? [];
    bucket.sort((a, b) => a.order - b.order);
    categoryById.set(category.id, {
      id: category.id,
      label: category.label,
      parentId: category.parent,
      isMajor: category.parent === "root",
      order: category.order,
      depth: 0,
      path: [],
      childCategoryIds: [],
      placementIds: bucket.map((placement) => placement.id),
    });
  }

  for (const category of categoryById.values()) {
    category.path = categoryPath(category.id);
    category.depth = Math.max(0, category.path.length - 1);
    if (category.parentId !== "root") {
      const parent = categoryById.get(category.parentId);
      if (parent) parent.childCategoryIds.push(category.id);
    }
  }

  const pathByCategory = new Map<string, Array<{ id: string; label: string }>>();
  for (const category of categoryById.values()) {
    pathByCategory.set(category.id, category.path);
  }
  for (const placement of placements) {
    placement.categoryPath = pathByCategory.get(placement.categoryId) ?? [];
  }

  const placementsByModule = new Map<string, PlacementRecord[]>();
  for (const placement of placements) {
    const bucket = placementsByModule.get(placement.moduleId) ?? [];
    bucket.push(placement);
    placementsByModule.set(placement.moduleId, bucket);
  }

  const modules: ModuleRecord[] = modulesSource.map((record) => {
    const modulePlacements = placementsByModule.get(record.id) ?? [];
    return {
      id: record.id,
      title: record.name,
      aliases: record.aliases,
      registryStatus: record.status,
      placements: modulePlacements,
      categoryIds: modulePlacements.map((placement) => placement.categoryId),
      categoryPaths: modulePlacements.map((placement) => placement.categoryPath),
    };
  });

  const categoryRecords = [...categoryById.values()];
  const counts: RegistryCounts = {
    majorCategories: categoryRecords.filter((category) => category.isMajor).length,
    categoryNodes: categoryRecords.length,
    leafPlacements: placements.length,
    canonicalModules: modules.length,
  };

  if (
    !hasExtensions &&
    (counts.majorCategories !== REQUIRED_COUNTS.majorCategories ||
      counts.categoryNodes !== REQUIRED_COUNTS.categoryNodes ||
      counts.leafPlacements !== REQUIRED_COUNTS.leafPlacements ||
      counts.canonicalModules !== REQUIRED_COUNTS.canonicalModules)
  ) {
    throw new RegistryValidationError([
      {
        code: "runtime-count-mismatch",
        message: `Runtime registry counts do not match the frozen scope: ${JSON.stringify(counts)}`,
      },
    ]);
  }

  return {
    root: { id: projection.root.id, label: projection.root.label },
    categories: categoryRecords,
    modules,
    placements,
    counts,
    sourceDigest: options.baselineDigest,
    projectionStatus: options.projectionStatus ?? projection.status,
    hasExtensions,
    provisionalNotice: PROVISIONAL_NOTICE,
  };
}

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

export function findModule(registry: RuntimeRegistry, id: string): ModuleRecord | undefined {
  return registry.modules.find((record) => record.id === id);
}

export function findCategory(
  registry: RuntimeRegistry,
  id: string,
): CategoryRecord | undefined {
  return registry.categories.find((category) => category.id === id);
}

export function modulesInCategory(
  registry: RuntimeRegistry,
  categoryId: string,
): ModuleRecord[] {
  const category = findCategory(registry, categoryId);
  if (!category) return [];
  const ids = new Set(category.placementIds);
  return registry.modules.filter((record) =>
    record.placements.some((placement) => ids.has(placement.id)),
  );
}

/* ------------------------------------------------------------------ */
/* Public DTOs (serializable, no internal paths)                       */
/* ------------------------------------------------------------------ */

export interface CategoryPathDto {
  ids: string[];
  labels: string[];
}

export interface ModuleSummaryDto {
  id: string;
  title: string;
  aliases: string[];
  kind: "model";
  status: ModuleLifecycleStatus;
  url: string;
  categories: CategoryPathDto[];
  /** Original placement labels preserved from the baseline. */
  placementLabels: string[];
}

export interface CategorySummaryDto {
  id: string;
  label: string;
  url: string;
  depth: number;
  path: CategoryPathDto;
  moduleCount: number;
}

export interface TreeModuleDto {
  id: string;
  title: string;
  label: string;
  url: string;
  status: ModuleLifecycleStatus;
}

export interface TreeNodeDto {
  id: string;
  label: string;
  url: string;
  depth: number;
  moduleCount: number;
  children: TreeNodeDto[];
  modules: TreeModuleDto[];
}

export interface TreeDto {
  root: { id: string; label: string };
  children: TreeNodeDto[];
  counts: RegistryCounts;
  provisionalNotice: string;
}

export type StatusResolver = (moduleId: string) => ModuleLifecycleStatus;

export const defaultStatusResolver: StatusResolver = () => "planned";

export function moduleUrl(id: string): string {
  return `/models/${id}`;
}

export function categoryUrl(id: string): string {
  return `/categories/${id}`;
}

export function toCategoryPathDto(
  path: Array<{ id: string; label: string }>,
): CategoryPathDto {
  return { ids: path.map((item) => item.id), labels: path.map((item) => item.label) };
}

export function toModuleSummaryDto(
  record: ModuleRecord,
  resolveStatus: StatusResolver = defaultStatusResolver,
): ModuleSummaryDto {
  return {
    id: record.id,
    title: record.title,
    aliases: record.aliases,
    kind: "model",
    status: resolveStatus(record.id),
    url: moduleUrl(record.id),
    categories: uniquePaths(record.categoryPaths).map(toCategoryPathDto),
    placementLabels: record.placements.map((placement) => placement.label),
  };
}

export function toCategorySummaryDto(category: CategoryRecord): CategorySummaryDto {
  return {
    id: category.id,
    label: category.label,
    url: categoryUrl(category.id),
    depth: category.depth,
    path: toCategoryPathDto(category.path),
    moduleCount: category.placementIds.length,
  };
}

function uniquePaths(
  paths: Array<Array<{ id: string; label: string }>>,
): Array<Array<{ id: string; label: string }>> {
  const seen = new Set<string>();
  const result: Array<Array<{ id: string; label: string }>> = [];
  for (const path of paths) {
    const key = path.map((item) => item.id).join("/");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(path);
  }
  return result;
}

/**
 * Build the expandable navigation tree DTO. Navigation is generated from
 * registry data; no taxonomy is hardcoded in components.
 */
export function buildTreeDto(
  registry: RuntimeRegistry,
  resolveStatus: StatusResolver = defaultStatusResolver,
): TreeDto {
  const categoryById = new Map(registry.categories.map((category) => [category.id, category]));
  const moduleById = new Map(registry.modules.map((record) => [record.id, record]));
  const placementsByCategory = new Map<string, PlacementRecord[]>();
  for (const placement of registry.placements) {
    const bucket = placementsByCategory.get(placement.categoryId) ?? [];
    bucket.push(placement);
    placementsByCategory.set(placement.categoryId, bucket);
  }

  const buildNode = (categoryId: string): TreeNodeDto => {
    const category = categoryById.get(categoryId);
    if (!category) throw new Error(`Unknown category ${categoryId}`);
    const children = category.childCategoryIds
      .map((id) => categoryById.get(id))
      .filter((child): child is CategoryRecord => Boolean(child))
      .sort((a, b) => a.order - b.order)
      .map((child) => buildNode(child.id));

    const modules = (placementsByCategory.get(categoryId) ?? [])
      .sort((a, b) => a.order - b.order)
      .map((placement) => {
        const record = moduleById.get(placement.moduleId);
        if (!record) throw new Error(`Unknown module ${placement.moduleId}`);
        return {
          id: record.id,
          title: record.title,
          label: placement.label,
          url: moduleUrl(record.id),
          status: resolveStatus(record.id),
        } satisfies TreeModuleDto;
      });

    return {
      id: category.id,
      label: category.label,
      url: categoryUrl(category.id),
      depth: category.depth,
      moduleCount:
        modules.length + children.reduce((total, child) => total + child.moduleCount, 0),
      children,
      modules,
    };
  };

  const children = registry.categories
    .filter((category) => category.isMajor)
    .sort((a, b) => a.order - b.order)
    .map((category) => buildNode(category.id));

  return {
    root: registry.root,
    children,
    counts: registry.counts,
    provisionalNotice: registry.provisionalNotice,
  };
}
