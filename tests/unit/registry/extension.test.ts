import { describe, expect, it } from "vitest";
import { buildCoverageSummary } from "@/server/registry/coverage";
import { buildTreeDto, findCategory, findModule } from "@/server/registry/build";
import { searchRegistry } from "@/server/search/search";
import { resolveModuleStatus } from "@/server/content/lessons";
import { SYNTHETIC_EXTENSION, buildRegistry, productionRegistry } from "../helpers/registry";

describe("additive registry extension", () => {
  const extended = buildRegistry(undefined, undefined, { extension: SYNTHETIC_EXTENSION });

  it("adds exactly one synthetic category, module and placement", () => {
    expect(extended.hasExtensions).toBe(true);
    expect(extended.counts.categoryNodes).toBe(productionRegistry.counts.categoryNodes + 1);
    expect(extended.counts.canonicalModules).toBe(productionRegistry.counts.canonicalModules + 1);
    expect(extended.counts.leafPlacements).toBe(productionRegistry.counts.leafPlacements + 1);
    expect(findCategory(extended, "test-only-synthetic-branch")?.path.map((p) => p.label)).toEqual([
      "Probability Distribution Models",
      "Test-Only Synthetic Branch",
    ]);
    expect(findModule(extended, "test-only-synthetic-model")?.title).toBe(
      "Test-Only Synthetic Model",
    );
  });

  it("appears automatically in navigation without component changes", () => {
    const tree = buildTreeDto(extended, resolveModuleStatus);
    const major = tree.children.find((node) => node.id === "probability-distribution-models");
    const synthetic = major?.children.find((node) => node.id === "test-only-synthetic-branch");
    expect(synthetic?.modules.map((module) => module.id)).toEqual(["test-only-synthetic-model"]);
  });

  it("appears automatically in search by canonical title and alias", () => {
    const byTitle = searchRegistry(extended, "Test-Only Synthetic Model", resolveModuleStatus);
    expect(byTitle[0]?.id).toBe("test-only-synthetic-model");
    const byAlias = searchRegistry(extended, "Synthetic Alias", resolveModuleStatus);
    expect(byAlias[0]?.id).toBe("test-only-synthetic-model");
    expect(byAlias[0]?.branches[0]?.labels).toEqual([
      "Probability Distribution Models",
      "Test-Only Synthetic Branch",
    ]);
  });

  it("appears automatically in coverage reporting", () => {
    const coverage = buildCoverageSummary(extended, resolveModuleStatus);
    const row = coverage.categories.find((category) => category.id === "test-only-synthetic-branch");
    expect(row?.leafPlacements).toBe(1);
    expect(coverage.moduleIds).toContain("test-only-synthetic-model");
    expect(coverage.counts.leafPlacements).toBe(124);
  });

  it("never leaks into the production registry", () => {
    const productionCoverage = buildCoverageSummary(productionRegistry, resolveModuleStatus);
    expect(productionCoverage.moduleIds).not.toContain("test-only-synthetic-model");
    expect(productionCoverage.categories.map((category) => category.id)).not.toContain(
      "test-only-synthetic-branch",
    );
    expect(searchRegistry(productionRegistry, "Synthetic Alias", resolveModuleStatus)).toHaveLength(0);
  });

  it("rejects an extension that collides with a baseline identifier", () => {
    expect(() =>
      buildRegistry(undefined, undefined, {
        extension: {
          categories: [
            {
              id: "continuous-distributions",
              label: "Duplicate",
              parent: "probability-distribution-models",
              order: 98,
            },
          ],
        },
      }),
    ).toThrow(/extension-duplicate-category/);
  });

  it("rejects an extension whose placement references an unknown module", () => {
    expect(() =>
      buildRegistry(undefined, undefined, {
        extension: {
          categories: [
            {
              id: "test-only-orphan",
              label: "Test-Only Orphan",
              parent: "probability-distribution-models",
              order: 97,
            },
          ],
          placements: [
            {
              id: "test-only-orphan--missing",
              category_id: "test-only-orphan",
              module_id: "missing-module",
              label: "Missing",
              order: 0,
            },
          ],
        },
      }),
    ).toThrow(/extension-unknown-placement-module/);
  });
});
