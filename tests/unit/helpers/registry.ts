import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildRuntimeRegistry } from "@/server/registry/build";
import type {
  Projection,
  RegistryExtension,
  RuntimeRegistry,
  ScopeBaseline,
} from "@/server/registry/types";

export const PROJECT_ROOT = process.cwd();
export const BASELINE_DIR = path.join(PROJECT_ROOT, "registry", "baseline");

export const BASELINE_PATH = path.join(BASELINE_DIR, "MODEL_SCOPE_BASELINE.json");
export const SOURCE_TREE_PATH = path.join(BASELINE_DIR, "SOURCE_TREE.txt");
export const PROJECTION_PATH = path.join(BASELINE_DIR, "TAXONOMY_PROJECTION_CANDIDATE.json");

export const FROZEN_SHA256 = {
  baseline: "e8ea11be46cb6c6d5907a19ea4ae2517a4e52413c50bd5bcf5a90067dccb6520",
  sourceTree: "f0e3e906ad0425fca06c54385544d990223d03d303becd2f202514171844a51a",
  projection: "344dad29f17d86b3a5a838eaae1c19b0abf78ffa2df06dbe98f98a56b4708c1a",
} as const;

export function sha256File(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

export function readBaseline(): ScopeBaseline {
  return JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as ScopeBaseline;
}

export function readProjection(): Projection {
  return JSON.parse(readFileSync(PROJECTION_PATH, "utf8")) as Projection;
}

export function baselineDigest(): string {
  return sha256File(BASELINE_PATH);
}

export function buildRegistry(
  baseline: ScopeBaseline = readBaseline(),
  projection: Projection = readProjection(),
  options: { extension?: RegistryExtension } = {},
): RuntimeRegistry {
  return buildRuntimeRegistry(baseline, projection, {
    baselineDigest: baselineDigest(),
    extension: options.extension,
  });
}

export const productionRegistry = buildRegistry();

export function cloneProjection(): Projection {
  return JSON.parse(JSON.stringify(readProjection())) as Projection;
}

/** Minimal test fixture mutation operations. */
type Mutation =
  | { op: "set"; path: Array<string | number>; value: unknown }
  | { op: "setById"; collection: "categories" | "modules" | "placements"; id: string; field: string; value: unknown }
  | { op: "removeById"; collection: "categories" | "modules" | "placements"; id: string }
  | { op: "push"; collection: "categories" | "modules" | "placements"; value: Record<string, unknown> };

export interface FixtureDescriptor {
  description: string;
  expectedIssueCode: string;
  mutations: Mutation[];
}

export function applyMutations(
  projection: Projection,
  mutations: Mutation[],
): Projection {
  const clone = JSON.parse(JSON.stringify(projection)) as Projection;
  for (const mutation of mutations) {
    if (mutation.op === "set") {
      let target: Record<string, unknown> | unknown[] = clone as unknown as Record<string, unknown>;
      for (let index = 0; index < mutation.path.length - 1; index += 1) {
        const key = mutation.path[index]!;
        target = (target as Record<string | number, unknown>)[key] as Record<string, unknown>;
      }
      const last = mutation.path[mutation.path.length - 1]!;
      (target as Record<string | number, unknown>)[last] = mutation.value;
    } else {
      const collection = clone[mutation.collection] as unknown as Array<Record<string, unknown>>;
      if (mutation.op === "setById") {
        const record = collection.find((item) => item.id === mutation.id);
        if (!record) throw new Error(`Fixture target ${mutation.id} not found`);
        record[mutation.field] = mutation.value;
      } else if (mutation.op === "push") {
        collection.push(mutation.value);
      } else {
        const index = collection.findIndex((item) => item.id === mutation.id);
        if (index === -1) throw new Error(`Fixture target ${mutation.id} not found`);
        collection.splice(index, 1);
      }
    }
  }
  return clone;
}

export function loadFixture(name: string): FixtureDescriptor {
  const file = path.join(PROJECT_ROOT, "tests", "fixtures", "registry-invalid", name);
  return JSON.parse(readFileSync(file, "utf8")) as FixtureDescriptor;
}

export const SYNTHETIC_EXTENSION: RegistryExtension = {
  categories: [
    {
      id: "test-only-synthetic-branch",
      label: "Test-Only Synthetic Branch",
      parent: "probability-distribution-models",
      order: 99,
    },
  ],
  modules: [
    {
      id: "test-only-synthetic-model",
      name: "Test-Only Synthetic Model",
      aliases: ["Synthetic Alias"],
      status: "planned",
    },
  ],
  placements: [
    {
      id: "test-only-synthetic-branch--test-only-synthetic-model",
      category_id: "test-only-synthetic-branch",
      module_id: "test-only-synthetic-model",
      label: "Test-Only Synthetic Model",
      order: 0,
    },
  ],
};
