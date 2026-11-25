import type {
  ModuleLifecycleStatus,
  RuntimeRegistry,
} from "@/server/registry/types";
import type { StatusResolver } from "@/server/registry/build";
import { categoryUrl, moduleUrl, toCategoryPathDto } from "@/server/registry/build";

/**
 * Read-only registry search.
 *
 * The handler is a pure function over the runtime registry so that HTTP
 * behaviour can be tested without a server, while the route handler remains a
 * thin adapter. The query is never used to access the filesystem or network.
 */

export const SEARCH_LIMIT = 20;
export const MAX_QUERY_LENGTH = 128;

export type SearchResultType = "category" | "model";
export type SearchMatch = "title" | "alias" | "placement-label" | "category";
export type SearchResultStatus = ModuleLifecycleStatus | "structure";

export interface SearchBranch {
  ids: string[];
  labels: string[];
}

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  url: string;
  status: SearchResultStatus;
  matchedOn: SearchMatch;
  aliases: string[];
  branches: SearchBranch[];
  /** Original baseline placement labels associated with the matched branches. */
  placementLabels: string[];
}

export interface SearchSuccessBody {
  query: string;
  normalizedQuery: string;
  count: number;
  limit: number;
  results: SearchResult[];
}

export interface SearchErrorBody {
  error: string;
  code: "invalid-query";
}

export type SearchResponse = { status: 200; body: SearchSuccessBody } | { status: 400; body: SearchErrorBody };

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export function normalizeQuery(raw: string): string {
  return raw.trim().normalize("NFKC").toLowerCase();
}

export function parseSearchQuery(
  params: URLSearchParams,
): { ok: true; query: string } | { ok: false; body: SearchErrorBody } {
  const values = params.getAll("q");
  if (values.length > 1) {
    return {
      ok: false,
      body: {
        error: "The q parameter must be supplied at most once.",
        code: "invalid-query",
      },
    };
  }

  const raw = values[0] ?? "";
  if (raw.length > MAX_QUERY_LENGTH) {
    return {
      ok: false,
      body: {
        error: `The q parameter must not exceed ${MAX_QUERY_LENGTH} characters.`,
        code: "invalid-query",
      },
    };
  }
  if (CONTROL_CHARACTERS.test(raw)) {
    return {
      ok: false,
      body: {
        error: "The q parameter contains unsupported control characters.",
        code: "invalid-query",
      },
    };
  }

  return { ok: true, query: raw };
}

interface Candidate {
  result: SearchResult;
  score: number;
}

function matchScore(needle: string, haystack: string): number | null {
  const value = haystack.normalize("NFKC").toLowerCase();
  if (value === needle) return 0;
  if (value.startsWith(needle)) return 1;
  if (value.includes(needle)) return 2;
  return null;
}

function sortCandidates(candidates: Candidate[]): Candidate[] {
  return candidates.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (a.result.type !== b.result.type) return a.result.type === "category" ? -1 : 1;
    return a.result.title < b.result.title ? -1 : a.result.title > b.result.title ? 1 : 0;
  });
}

/**
 * Search categories and canonical modules.
 *
 * Ranking: exact title/alias/placement-label, then prefix, then substring.
 * Canonical modules are deduplicated; every match reports its branch context.
 */
export function searchRegistry(
  registry: RuntimeRegistry,
  rawQuery: string,
  resolveStatus: StatusResolver,
  limit: number = SEARCH_LIMIT,
): SearchResult[] {
  const query = normalizeQuery(rawQuery);
  if (query.length === 0) return [];

  const candidates: Candidate[] = [];

  for (const category of registry.categories) {
    const score = matchScore(query, category.label);
    if (score === null) continue;
    candidates.push({
      score,
      result: {
        type: "category",
        id: category.id,
        title: category.label,
        url: categoryUrl(category.id),
        status: "structure",
        matchedOn: "category",
        aliases: [],
        branches: [toCategoryPathDto(category.path)],
        placementLabels: [],
      },
    });
  }

  for (const record of registry.modules) {
    let best: { score: number; matchedOn: SearchMatch } | null = null;

    const titleScore = matchScore(query, record.title);
    if (titleScore !== null) best = { score: titleScore, matchedOn: "title" };

    for (const alias of record.aliases) {
      const aliasScore = matchScore(query, alias);
      if (aliasScore === null) continue;
      if (!best || aliasScore < best.score) best = { score: aliasScore, matchedOn: "alias" };
    }

    const matchingPlacementLabels = new Set<string>();
    for (const placement of record.placements) {
      const labelScore = matchScore(query, placement.label);
      if (labelScore === null) continue;
      matchingPlacementLabels.add(placement.label);
      if (!best || labelScore < best.score) {
        best = { score: labelScore, matchedOn: "placement-label" };
      }
    }

    if (!best) continue;

    const branchSource =
      matchingPlacementLabels.size > 0
        ? record.placements.filter((placement) => matchingPlacementLabels.has(placement.label))
        : record.placements;

    const seenBranches = new Set<string>();
    const branches: SearchBranch[] = [];
    for (const placement of branchSource) {
      const dto = toCategoryPathDto(placement.categoryPath);
      const key = dto.ids.join("/");
      if (seenBranches.has(key)) continue;
      seenBranches.add(key);
      branches.push(dto);
    }

    candidates.push({
      score: best.score,
      result: {
        type: "model",
        id: record.id,
        title: record.title,
        url: moduleUrl(record.id),
        status: resolveStatus(record.id),
        matchedOn: best.matchedOn,
        aliases: record.aliases,
        branches,
        placementLabels: [...matchingPlacementLabels],
      },
    });
  }

  return sortCandidates(candidates)
    .slice(0, Math.max(0, limit))
    .map((candidate) => candidate.result);
}

export function handleSearchRequest(
  url: URL,
  registry: RuntimeRegistry,
  resolveStatus: StatusResolver,
): SearchResponse {
  const parsed = parseSearchQuery(url.searchParams);
  if (!parsed.ok) {
    return { status: 400, body: parsed.body };
  }

  const results = searchRegistry(registry, parsed.query, resolveStatus);
  return {
    status: 200,
    body: {
      query: parsed.query,
      normalizedQuery: normalizeQuery(parsed.query),
      count: results.length,
      limit: SEARCH_LIMIT,
      results,
    },
  };
}
