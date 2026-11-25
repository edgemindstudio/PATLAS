import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildRuntimeRegistry } from "./build";
import type { Projection, RuntimeRegistry, ScopeBaseline } from "./types";

/**
 * File-backed registry access. This module must only be imported by server
 * components, route handlers and tests — never by client components.
 */

export const BASELINE_FILES = {
  scope: "MODEL_SCOPE_BASELINE.json",
  tree: "SOURCE_TREE.txt",
  projection: "TAXONOMY_PROJECTION_CANDIDATE.json",
} as const;

export function defaultBaselineDirectory(): string {
  return path.join(process.cwd(), "registry", "baseline");
}

export function sha256Hex(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export interface RegistrySource {
  baseline: ScopeBaseline;
  projection: Projection;
  baselineDigest: string;
  sourceTree: string;
  projectionDigest: string;
}

export async function readRegistrySource(): Promise<RegistrySource> {
  const directory = defaultBaselineDirectory();
  // Literal file names keep Next.js/Turbopack output tracing scoped to the
  // frozen registry directory instead of the whole project.
  const [baselineBytes, sourceTreeBytes, projectionBytes] = await Promise.all([
    readFile(path.join(directory, "MODEL_SCOPE_BASELINE.json")),
    readFile(path.join(directory, "SOURCE_TREE.txt")),
    readFile(path.join(directory, "TAXONOMY_PROJECTION_CANDIDATE.json")),
  ]);

  const baselineDigest = sha256Hex(baselineBytes);
  const sourceTree = sourceTreeBytes.toString("utf8");

  if (sourceTree.trim().length === 0) {
    throw new Error("SOURCE_TREE.txt is empty");
  }

  let baseline: ScopeBaseline;
  let projection: Projection;
  try {
    baseline = JSON.parse(baselineBytes.toString("utf8")) as ScopeBaseline;
    projection = JSON.parse(projectionBytes.toString("utf8")) as Projection;
  } catch (error) {
    throw new Error(
      `Frozen registry files are not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return {
    baseline,
    projection,
    baselineDigest,
    sourceTree,
    projectionDigest: sha256Hex(projectionBytes),
  };
}

let cached: Promise<RuntimeRegistry> | undefined;

export function loadRegistry(): Promise<RuntimeRegistry> {
  if (!cached) {
    cached = readRegistrySource().then((source) =>
      buildRuntimeRegistry(source.baseline, source.projection, {
        baselineDigest: source.baselineDigest,
      }),
    );
  }
  return cached;
}

/** Test helper: force the next load to re-read the frozen files. */
export function clearRegistryCache(): void {
  cached = undefined;
}
