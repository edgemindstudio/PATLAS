import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildRuntimeRegistry } from "@/server/registry/build";
import { deriveTaxonomyFromBaseline, validateRegistrySource } from "@/server/registry/validate";
import { RegistryValidationError } from "@/server/registry/types";
import {
  BASELINE_PATH,
  FROZEN_SHA256,
  PROJECT_ROOT,
  PROJECTION_PATH,
  SOURCE_TREE_PATH,
  applyMutations,
  baselineDigest,
  buildRegistry,
  cloneProjection,
  loadFixture,
  productionRegistry,
  readBaseline,
  readProjection,
  sha256File,
} from "../helpers/registry";

const PLANNING_DIR = path.join(PROJECT_ROOT, "docs", "planning", "v0.6");

describe("frozen registry files", () => {
  it("imports the three frozen scope files byte-for-byte from the approved package", () => {
    expect(sha256File(BASELINE_PATH)).toBe(FROZEN_SHA256.baseline);
    expect(sha256File(SOURCE_TREE_PATH)).toBe(FROZEN_SHA256.sourceTree);
    expect(sha256File(PROJECTION_PATH)).toBe(FROZEN_SHA256.projection);

    for (const [file, digest] of [
      ["MODEL_SCOPE_BASELINE.json", FROZEN_SHA256.baseline],
      ["SOURCE_TREE.txt", FROZEN_SHA256.sourceTree],
      ["TAXONOMY_PROJECTION_CANDIDATE.json", FROZEN_SHA256.projection],
    ] as const) {
      const archived = readFileSync(path.join(PLANNING_DIR, file));
      const runtime = readFileSync(path.join(PROJECT_ROOT, "registry", "baseline", file));
      expect(runtime.equals(archived), `${file} must be byte-identical`).toBe(true);
      expect(sha256File(path.join(PLANNING_DIR, file))).toBe(digest);
    }
  });

  it("keeps the projection source digest equal to the baseline digest", () => {
    expect(readProjection().source_sha256).toBe(baselineDigest());
    expect(productionRegistry.sourceDigest).toBe(FROZEN_SHA256.baseline);
  });
});

describe("registry structure", () => {
  it("reports the required 9 / 32 / 123 / 109 counts", () => {
    expect(productionRegistry.counts).toEqual({
      majorCategories: 9,
      categoryNodes: 32,
      leafPlacements: 123,
      canonicalModules: 109,
    });
  });

  it("preserves exact ordered traversal parity with the frozen baseline", () => {
    const derived = deriveTaxonomyFromBaseline(readBaseline());
    const projection = readProjection();
    expect(derived.categories).toEqual(projection.categories);
    expect(derived.placements).toEqual(projection.placements);
  });

  it("has unique category, module and placement identifiers", () => {
    const ids = <T extends { id: string }>(items: T[]) => new Set(items.map((item) => item.id)).size;
    expect(ids(productionRegistry.categories)).toBe(productionRegistry.categories.length);
    expect(ids(productionRegistry.modules)).toBe(productionRegistry.modules.length);
    expect(ids(productionRegistry.placements)).toBe(productionRegistry.placements.length);
  });

  it("has valid parents, no hierarchy cycles and valid placement endpoints", () => {
    const byId = new Map(productionRegistry.categories.map((category) => [category.id, category]));
    const moduleIds = new Set(productionRegistry.modules.map((module) => module.id));
    for (const category of productionRegistry.categories) {
      if (category.parentId !== "root") {
        expect(byId.has(category.parentId), `${category.id} parent`).toBe(true);
      }
      let cursor: string | undefined = category.id;
      const seen = new Set<string>();
      while (cursor && cursor !== "root") {
        expect(seen.has(cursor), `cycle at ${category.id}`).toBe(false);
        seen.add(cursor);
        cursor = byId.get(cursor)?.parentId;
      }
    }
    for (const placement of productionRegistry.placements) {
      expect(byId.has(placement.categoryId)).toBe(true);
      expect(moduleIds.has(placement.moduleId)).toBe(true);
    }
  });

  it("preserves all 123 placements and 109 canonical modules with alias labels intact", () => {
    expect(productionRegistry.placements).toHaveLength(123);
    expect(productionRegistry.modules).toHaveLength(109);
    const hmm = productionRegistry.modules.find((module) => module.id === "hidden-markov-models-hmm");
    expect(hmm?.title).toBe("Hidden Markov Models (HMM)");
    expect(hmm?.aliases).toEqual(["Hidden Markov Models"]);
    expect(hmm?.placements).toHaveLength(3);
    expect(hmm?.categoryPaths.map((p) => p.map((item) => item.label))).toEqual([
      ["Probabilistic Graphical Models (PGM)", "Directed Graphical Models"],
      ["Probabilistic Latent Variable Models", "Discrete Latent Variable Models"],
      ["Sequential Probabilistic Models", "Markov Models"],
    ]);
  });

  it("retains the 13 duplicate canonical groups and 14 redundant placements", () => {
    const duplicated = productionRegistry.modules.filter((module) => module.placements.length > 1);
    expect(duplicated).toHaveLength(13);
    const redundant = productionRegistry.modules.reduce(
      (total, module) => total + module.placements.length - 1,
      0,
    );
    expect(redundant).toBe(14);

    const vae = productionRegistry.modules.find((module) => module.id === "variational-autoencoder-vae");
    expect(vae?.placements.map((placement) => placement.label).sort()).toEqual(
      ["VAE", "Variational Autoencoder (VAE)"].sort(),
    );
  });

  it("marks canonical identities as provisional in the public registry", () => {
    expect(productionRegistry.projectionStatus).toBe("proposal");
    expect(productionRegistry.provisionalNotice).toMatch(/provisional/i);
    expect(productionRegistry.hasExtensions).toBe(false);
  });

  it("does not include synthetic or unknown modules in production data", () => {
    expect(productionRegistry.modules.some((module) => module.id.startsWith("test-only"))).toBe(false);
    expect(productionRegistry.categories.some((category) => category.id.startsWith("test-only"))).toBe(
      false,
    );
  });
});

describe("registry validation rejects invalid fixtures", () => {
  const fixtures = [
    "digest-mismatch.json",
    "cycle.json",
    "unknown-parent.json",
    "duplicate-category.json",
    "unknown-placement-module.json",
    "missing-module.json",
    "truncated-traversal.json",
    "duplicate-placement-order.json",
    "module-rename.json",
    "extra-module.json",
  ];

  for (const fixtureName of fixtures) {
    it(`rejects ${fixtureName}`, () => {
      const fixture = loadFixture(fixtureName);
      const projection = applyMutations(cloneProjection(), fixture.mutations);
      const baseline = readBaseline();
      try {
        buildRuntimeRegistry(baseline, projection, { baselineDigest: baselineDigest() });
        throw new Error(`Fixture ${fixtureName} was not rejected`);
      } catch (error) {
        expect(error).toBeInstanceOf(RegistryValidationError);
        const issues = (error as RegistryValidationError).issues;
        expect(issues.map((issue) => issue.code)).toContain(fixture.expectedIssueCode);
      }
    });
  }

  it("rejects a baseline whose declared counts disagree with its traversal", () => {
    const baseline = readBaseline();
    baseline.counts.category_nodes = 31;
    const issues = validateRegistrySource(baseline, readProjection(), {
      baselineDigest: baselineDigest(),
    });
    expect(issues.map((issue) => issue.code)).toContain("declared-count-mismatch");
  });

  it("rejects a registry with an upload of an unknown status via schema", () => {
    const projection = cloneProjection();
    (projection.modules[0] as unknown as { status: string }).status = "accepted";
    const issues = validateRegistrySource(readBaseline(), projection, {
      baselineDigest: baselineDigest(),
    });
    expect(issues.map((issue) => issue.code)).toContain("projection-schema");
  });
});

describe("navigation DTO", () => {
  it("reports subtree placement counts per branch", async () => {
    const { buildTreeDto } = await import("@/server/registry/build");
    const tree = buildTreeDto(productionRegistry);
    const major = tree.children.find((node) => node.id === "probability-distribution-models");
    expect(major?.moduleCount).toBe(23);
    const continuous = major?.children.find((node) => node.id === "continuous-distributions");
    expect(continuous?.moduleCount).toBe(9);
    const total = tree.children.reduce((sum, node) => sum + node.moduleCount, 0);
    expect(total).toBe(123);
  });
});
