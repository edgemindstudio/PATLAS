/**
 * Types shared by the registry loader, validation and public DTO builders.
 *
 * The frozen baseline is a Founder-supplied planning artifact. Nothing in this
 * module rewrites it; runtime structures are derived deterministically.
 */

export interface ScopeBaselineLeaf {
  label: string;
  module_id: string;
}

export interface ScopeBaselineCategory {
  label: string;
  id: string;
  children: Array<ScopeBaselineCategory | ScopeBaselineLeaf>;
}

export interface ScopeBaselineModule {
  id: string;
  name: string;
  aliases: string[];
  status: "planned";
}

export interface ScopeBaseline {
  schema_version: string;
  status?: string;
  source?: string;
  root: string;
  categories: ScopeBaselineCategory[];
  modules: ScopeBaselineModule[];
  counts: {
    major_categories: number;
    category_nodes: number;
    leaf_occurrences: number;
    canonical_leaf_modules: number;
  };
  notes?: string[];
}

export interface ProjectionCategory {
  id: string;
  label: string;
  parent: string;
  order: number;
}

export interface ProjectionPlacement {
  id: string;
  category_id: string;
  module_id: string;
  label: string;
  order: number;
}

export interface Projection {
  schema_version: string;
  status: "proposal" | "approved";
  source_sha256: string;
  root: { id: string; label: string };
  categories: ProjectionCategory[];
  placements: ProjectionPlacement[];
  modules: ScopeBaselineModule[];
}

export type ModuleLifecycleStatus = "planned" | "partial" | "implemented" | "verified";

export interface PlacementRecord {
  id: string;
  categoryId: string;
  moduleId: string;
  label: string;
  order: number;
  /** Category path from the major category down to the immediate parent. */
  categoryPath: Array<{ id: string; label: string }>;
}

export interface CategoryRecord {
  id: string;
  label: string;
  parentId: string;
  /** Parent is the registry root rather than another category. */
  isMajor: boolean;
  order: number;
  depth: number;
  path: Array<{ id: string; label: string }>;
  childCategoryIds: string[];
  placementIds: string[];
}

export interface ModuleRecord {
  id: string;
  title: string;
  aliases: string[];
  /** Lifecycle status from the frozen projection. Content status is separate. */
  registryStatus: "planned";
  placements: PlacementRecord[];
  categoryIds: string[];
  /** Every branch in which the canonical module is placed. */
  categoryPaths: Array<Array<{ id: string; label: string }>>;
}

export interface RegistryCounts {
  majorCategories: number;
  categoryNodes: number;
  leafPlacements: number;
  canonicalModules: number;
}

/**
 * Additive registry extension. The extension contract allows new categories,
 * modules and placements without rewriting or removing baseline placements.
 * Production builds pass no extension; the test suite uses a synthetic one.
 */
export interface RegistryExtension {
  categories?: ProjectionCategory[];
  modules?: ScopeBaselineModule[];
  placements?: ProjectionPlacement[];
}

export interface RuntimeRegistry {
  root: { id: string; label: string };
  categories: CategoryRecord[];
  modules: ModuleRecord[];
  placements: PlacementRecord[];
  counts: RegistryCounts;
  /** SHA-256 of the frozen baseline file actually loaded. */
  sourceDigest: string;
  projectionStatus: "proposal" | "approved";
  /** True only when a test extension was applied; production builds use false. */
  hasExtensions: boolean;
  /** Human-readable provisional warning surfaced in the UI. */
  provisionalNotice: string;
}

export interface RegistryIssue {
  code: string;
  message: string;
  path?: string;
}

export class RegistryValidationError extends Error {
  readonly issues: RegistryIssue[];

  constructor(issues: RegistryIssue[]) {
    super(
      `Registry validation failed with ${issues.length} issue(s): ` +
        issues.map((issue) => `${issue.code} ${issue.message}`).join("; "),
    );
    this.name = "RegistryValidationError";
    this.issues = issues;
  }
}
