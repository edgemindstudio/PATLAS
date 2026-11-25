import { describe, expect, it } from "vitest";
import { buildTreeDto, type TreeNodeDto } from "@/server/registry/build";
import type { RegistryExtension } from "@/server/registry/types";
import { filterTree } from "@/ui/tree-filter";
import { buildRegistry, productionRegistry } from "../helpers/registry";

function flattenModuleLabels(node: TreeNodeDto): string[] {
  const labels: string[] = [];
  for (const entry of node.entries) {
    if (entry.type === "module") labels.push(entry.module.label);
    else labels.push(...flattenModuleLabels(entry.node));
  }
  return labels;
}

describe("mixed sibling ordering (RF-013)", () => {
  const tree = buildTreeDto(productionRegistry);

  it("keeps the frozen PGM category/leaf sibling order in the DTO", () => {
    const pgm = tree.children.find((node) => node.id === "probabilistic-graphical-models-pgm");
    expect(pgm).toBeDefined();
    expect(
      pgm!.entries.map((entry) =>
        entry.type === "category" ? entry.node.label : entry.module.label,
      ),
    ).toEqual([
      "Directed Graphical Models",
      "Undirected Graphical Models",
      "Factor Graph Representations",
    ]);
    expect(pgm!.entries.map((entry) => entry.type)).toEqual(["category", "category", "module"]);
  });

  it("produces every baseline placement exactly once in baseline order", () => {
    const labels = tree.children.flatMap((node) => flattenModuleLabels(node));
    expect(labels).toEqual(productionRegistry.placements.map((placement) => placement.label));
    expect(labels).toHaveLength(123);
  });

  it("preserves mixed order for a general parent with a leaf before a subcategory", () => {
    const extension: RegistryExtension = {
      categories: [
        {
          id: "test-only-mixed-parent",
          label: "Test-Only Mixed Parent",
          parent: "probability-distribution-models",
          order: 98,
        },
        {
          id: "test-only-alpha-branch",
          label: "Alpha Branch",
          parent: "test-only-mixed-parent",
          order: 1,
        },
      ],
      modules: [
        {
          id: "test-only-alpha-leaf",
          name: "Alpha Leaf",
          aliases: [],
          status: "planned",
        },
      ],
      placements: [
        {
          id: "test-only-mixed-parent--test-only-alpha-leaf",
          category_id: "test-only-mixed-parent",
          module_id: "test-only-alpha-leaf",
          label: "Alpha Leaf",
          order: 0,
        },
      ],
    };

    const extended = buildRegistry(undefined, undefined, { extension });
    const extendedTree = buildTreeDto(extended);
    const parent = extendedTree.children
      .find((node) => node.id === "probability-distribution-models")
      ?.entries.find(
        (entry) => entry.type === "category" && entry.node.id === "test-only-mixed-parent",
      );
    expect(parent?.type).toBe("category");
    if (!parent || parent.type !== "category") return;

    expect(
      parent.node.entries.map((entry) =>
        entry.type === "module" ? entry.module.label : entry.node.label,
      ),
    ).toEqual(["Alpha Leaf", "Alpha Branch"]);
    expect(parent.node.entries.map((entry) => entry.type)).toEqual(["module", "category"]);
  });

  it("keeps relative order when filtering retains several sibling entries", () => {
    const extension: RegistryExtension = {
      categories: [
        {
          id: "test-only-filter-parent",
          label: "Test-Only Filter Parent",
          parent: "probability-distribution-models",
          order: 97,
        },
        {
          id: "test-only-alpha-category",
          label: "Alpha Category",
          parent: "test-only-filter-parent",
          order: 1,
        },
      ],
      modules: [
        { id: "test-only-alpha-model", name: "Alpha Model", aliases: [], status: "planned" },
      ],
      placements: [
        {
          id: "test-only-filter-parent--test-only-alpha-model",
          category_id: "test-only-filter-parent",
          module_id: "test-only-alpha-model",
          label: "Alpha Model",
          order: 0,
        },
      ],
    };

    const extended = buildRegistry(undefined, undefined, { extension });
    const extendedTree = buildTreeDto(extended);
    const filtered = filterTree(extendedTree, "alpha");
    const parent = filtered.children
      .find((node) => node.id === "probability-distribution-models")
      ?.entries.find(
        (entry) => entry.type === "category" && entry.node.id === "test-only-filter-parent",
      );
    if (!parent || parent.type !== "category") throw new Error("filtered parent missing");

    expect(
      parent.node.entries.map((entry) =>
        entry.type === "module" ? entry.module.label : entry.node.label,
      ),
    ).toEqual(["Alpha Model", "Alpha Category"]);
    expect(parent.node.entries.map((entry) => entry.type)).toEqual(["module", "category"]);
  });

  it("filters out non-matching siblings without reordering survivors", () => {
    const filtered = filterTree(tree, "Factor Graph");
    const pgm = filtered.children.find((node) => node.id === "probabilistic-graphical-models-pgm");
    expect(pgm?.entries.map((entry) => entry.type)).toEqual(["module"]);
    expect(pgm?.entries[0]?.type === "module" ? pgm.entries[0].module.label : "").toBe(
      "Factor Graph Representations",
    );
  });
});
