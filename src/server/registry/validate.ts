import Ajv, { type ErrorObject } from "ajv";
import baselineSchema from "../../../registry/schema/scope-baseline.schema.json";
import projectionSchema from "../../../registry/schema/taxonomy-projection.schema.json";
import {
  type Projection,
  type ProjectionCategory,
  type ProjectionPlacement,
  type RegistryIssue,
  type ScopeBaseline,
  type ScopeBaselineCategory,
  type ScopeBaselineLeaf,
} from "./types";

/**
 * Frozen scope invariants required by PATLAS-M001.
 *
 * These are checked against the baseline metadata and the derived traversal so
 * that a mutated baseline cannot pass by editing its own `counts` block.
 */
export const REQUIRED_COUNTS = {
  majorCategories: 9,
  categoryNodes: 32,
  leafPlacements: 123,
  canonicalModules: 109,
} as const;

const ajv = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
const validateBaselineSchema = ajv.compile<ScopeBaseline>(baselineSchema);
const validateProjectionSchema = ajv.compile<Projection>(projectionSchema);

function formatSchemaErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return "unknown schema error";
  return errors
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`)
    .join("; ");
}

function isCategory(
  node: ScopeBaselineCategory | ScopeBaselineLeaf,
): node is ScopeBaselineCategory {
  return "children" in node && Array.isArray(node.children);
}

export interface DerivedTaxonomy {
  categories: ProjectionCategory[];
  placements: ProjectionPlacement[];
}

/**
 * Deterministically derive the canonical category/placement traversal from the
 * frozen baseline. Sibling order is preserved across mixed category and leaf
 * children, which is how the projection orders the PGM branch.
 */
export function deriveTaxonomyFromBaseline(baseline: ScopeBaseline): DerivedTaxonomy {
  const categories: ProjectionCategory[] = [];
  const placements: ProjectionPlacement[] = [];

  const visit = (
    nodes: Array<ScopeBaselineCategory | ScopeBaselineLeaf>,
    parentId: string,
  ): void => {
    nodes.forEach((node, index) => {
      if (isCategory(node)) {
        categories.push({
          id: node.id,
          label: node.label,
          parent: parentId,
          order: index,
        });
        visit(node.children, node.id);
        return;
      }

      placements.push({
        id: `${parentId}--${node.module_id}`,
        category_id: parentId,
        module_id: node.module_id,
        label: node.label,
        order: index,
      });
    });
  };

  visit(baseline.categories, "root");
  return { categories, placements };
}

function compareOrdered<T extends object>(
  label: string,
  actual: T[],
  expected: T[],
  fields: Array<keyof T>,
  issues: RegistryIssue[],
): void {
  if (actual.length !== expected.length) {
    issues.push({
      code: "traversal-length",
      message: `${label}: expected ${expected.length} records, received ${actual.length}`,
    });
    return;
  }

  for (let index = 0; index < expected.length; index += 1) {
    const a = actual[index]!;
    const e = expected[index]!;
    for (const field of fields) {
      if (a[field] !== e[field]) {
        issues.push({
          code: "traversal-parity",
          message:
            `${label}[${index}].${String(field)} expected ` +
            `${JSON.stringify(e[field])}, received ${JSON.stringify(a[field])}`,
        });
      }
    }
  }
}

/**
 * Validate the archived baseline and the projection candidate, including exact
 * ordered traversal parity and source-digest equivalence.
 */
export function validateRegistrySource(
  baseline: ScopeBaseline,
  projection: Projection,
  options: { baselineDigest: string },
): RegistryIssue[] {
  const issues: RegistryIssue[] = [];

  if (!validateBaselineSchema(baseline)) {
    issues.push({
      code: "baseline-schema",
      message: formatSchemaErrors(validateBaselineSchema.errors),
    });
  }
  if (!validateProjectionSchema(projection)) {
    issues.push({
      code: "projection-schema",
      message: formatSchemaErrors(validateProjectionSchema.errors),
    });
  }
  if (issues.length > 0) return issues;

  if (baseline.root !== projection.root.label) {
    issues.push({
      code: "root-mismatch",
      message: `Baseline root "${baseline.root}" does not match projection root "${projection.root.label}"`,
    });
  }

  if (projection.source_sha256 !== options.baselineDigest) {
    issues.push({
      code: "source-digest",
      message:
        `Projection source_sha256 ${projection.source_sha256} does not match ` +
        `loaded baseline digest ${options.baselineDigest}`,
    });
  }

  const derived = deriveTaxonomyFromBaseline(baseline);

  // Category identity, parent validity and cycles.
  const categoryIds = new Set<string>();
  for (const category of projection.categories) {
    if (categoryIds.has(category.id)) {
      issues.push({
        code: "duplicate-category",
        message: `Duplicate category id "${category.id}"`,
      });
    }
    categoryIds.add(category.id);
  }

  const parentById = new Map(projection.categories.map((c) => [c.id, c.parent]));
  for (const category of projection.categories) {
    if (category.parent !== projection.root.id && !categoryIds.has(category.parent)) {
      issues.push({
        code: "unknown-parent",
        message: `Category "${category.id}" references unknown parent "${category.parent}"`,
      });
    }
  }

  for (const category of projection.categories) {
    const seen = new Set<string>([category.id]);
    let cursor: string | undefined = category.parent;
    while (cursor !== projection.root.id && cursor !== undefined) {
      if (seen.has(cursor)) {
        issues.push({
          code: "category-cycle",
          message: `Category hierarchy cycle detected at "${category.id}"`,
        });
        break;
      }
      seen.add(cursor);
      cursor = parentById.get(cursor);
      if (cursor === undefined) break;
    }
  }

  // Sibling order uniqueness.
  const siblingOrders = new Map<string, Set<number>>();
  for (const category of projection.categories) {
    const orders = siblingOrders.get(category.parent) ?? new Set<number>();
    if (orders.has(category.order)) {
      issues.push({
        code: "duplicate-category-order",
        message: `Duplicate sibling order ${category.order} under "${category.parent}"`,
      });
    }
    orders.add(category.order);
    siblingOrders.set(category.parent, orders);
  }

  // Reject duplicate canonical module identifiers before constructing lookup
  // Maps, which would otherwise collapse duplicates silently (RF-010).
  for (const [sourceName, modules] of [
    ["baseline", baseline.modules],
    ["projection", projection.modules],
  ] as const) {
    const seenModuleIds = new Set<string>();
    for (const record of modules) {
      if (seenModuleIds.has(record.id)) {
        issues.push({
          code: `duplicate-${sourceName}-module`,
          message: `Duplicate canonical module id "${record.id}" in ${sourceName} modules`,
        });
      }
      seenModuleIds.add(record.id);
    }
  }

  // Module identity sets must match the baseline exactly.
  const baselineModules = new Map(baseline.modules.map((module) => [module.id, module]));
  const projectionModules = new Map(projection.modules.map((module) => [module.id, module]));
  for (const id of baselineModules.keys()) {
    if (!projectionModules.has(id)) {
      issues.push({
        code: "missing-module",
        message: `Projection is missing baseline module "${id}"`,
      });
    }
  }
  for (const id of projectionModules.keys()) {
    if (!baselineModules.has(id)) {
      issues.push({
        code: "extra-module",
        message: `Projection introduces module "${id}" that is absent from the baseline`,
      });
    }
  }

  for (const [id, module] of baselineModules) {
    const projected = projectionModules.get(id);
    if (!projected) continue;
    if (projected.name !== module.name) {
      issues.push({
        code: "module-rename",
        message: `Module "${id}" canonical title changed from "${module.name}" to "${projected.name}"`,
      });
    }
    if (JSON.stringify(projected.aliases) !== JSON.stringify(module.aliases)) {
      issues.push({
        code: "module-alias-change",
        message: `Module "${id}" aliases differ between baseline and projection`,
      });
    }
  }

  // Placement endpoints, uniqueness and ordering.
  const placementIds = new Set<string>();
  const placementPairs = new Set<string>();
  for (const placement of projection.placements) {
    if (placementIds.has(placement.id)) {
      issues.push({
        code: "duplicate-placement",
        message: `Duplicate placement id "${placement.id}"`,
      });
    }
    placementIds.add(placement.id);

    const pair = `${placement.category_id}::${placement.module_id}`;
    if (placementPairs.has(pair)) {
      issues.push({
        code: "duplicate-placement-endpoint",
        message: `Duplicate placement of "${placement.module_id}" in "${placement.category_id}"`,
      });
    }
    placementPairs.add(pair);

    if (!categoryIds.has(placement.category_id)) {
      issues.push({
        code: "unknown-placement-category",
        message: `Placement "${placement.id}" references unknown category "${placement.category_id}"`,
      });
    }
    if (!projectionModules.has(placement.module_id)) {
      issues.push({
        code: "unknown-placement-module",
        message: `Placement "${placement.id}" references unknown module "${placement.module_id}"`,
      });
    }
  }

  const placementOrders = new Map<string, Set<number>>();
  for (const placement of projection.placements) {
    const orders = placementOrders.get(placement.category_id) ?? new Set<number>();
    if (orders.has(placement.order)) {
      issues.push({
        code: "duplicate-placement-order",
        message: `Duplicate placement order ${placement.order} under "${placement.category_id}"`,
      });
    }
    orders.add(placement.order);
    placementOrders.set(placement.category_id, orders);
  }

  // Every canonical module must retain at least one baseline placement.
  const placedModules = new Set(projection.placements.map((p) => p.module_id));
  for (const id of projectionModules.keys()) {
    if (!placedModules.has(id)) {
      issues.push({
        code: "unplaced-module",
        message: `Canonical module "${id}" has no placement`,
      });
    }
  }

  // Exact ordered traversal parity with the frozen baseline.
  compareOrdered(
    "categories",
    projection.categories,
    derived.categories,
    ["id", "label", "parent", "order"],
    issues,
  );
  compareOrdered(
    "placements",
    projection.placements,
    derived.placements,
    ["id", "category_id", "module_id", "label", "order"],
    issues,
  );

  // Frozen counts must agree with metadata, derived traversal and constants.
  const computed = {
    majorCategories: derived.categories.filter((c) => c.parent === "root").length,
    categoryNodes: derived.categories.length,
    leafPlacements: derived.placements.length,
    canonicalModules: projectionModules.size,
  };
  const declared = {
    majorCategories: baseline.counts.major_categories,
    categoryNodes: baseline.counts.category_nodes,
    leafPlacements: baseline.counts.leaf_occurrences,
    canonicalModules: baseline.counts.canonical_leaf_modules,
  };

  for (const key of Object.keys(REQUIRED_COUNTS) as Array<keyof typeof REQUIRED_COUNTS>) {
    if (computed[key] !== REQUIRED_COUNTS[key]) {
      issues.push({
        code: "count-mismatch",
        message: `Computed ${key}=${computed[key]} but M001 requires ${REQUIRED_COUNTS[key]}`,
      });
    }
    if (declared[key] !== computed[key]) {
      issues.push({
        code: "declared-count-mismatch",
        message: `Baseline declares ${key}=${declared[key]} but traversal yields ${computed[key]}`,
      });
    }
  }

  return issues;
}
