import { describe, expect, it } from "vitest";
import {
  MAX_QUERY_LENGTH,
  SEARCH_LIMIT,
  handleSearchRequest,
  normalizeQuery,
  parseSearchQuery,
  searchRegistry,
} from "@/server/search/search";
import { resolveModuleStatus } from "@/server/content/lessons";
import { productionRegistry } from "../helpers/registry";

const url = (query: string) => new URL(`http://localhost/api/search${query}`);

const search = (query: string) =>
  handleSearchRequest(url(`?q=${encodeURIComponent(query)}`), productionRegistry, resolveModuleStatus);

describe("query parsing", () => {
  it("trims and normalises case and Unicode width", () => {
    expect(normalizeQuery("  GAUSSİAN  ")).toBe(normalizeQuery("gaussİan"));
    expect(normalizeQuery("  Gaussian ")).toBe("gaussian");
    expect(normalizeQuery("ＧＡＵＳＳＩＡＮ")).toBe("gaussian");
  });

  it("rejects duplicate q parameters", () => {
    const response = handleSearchRequest(
      new URL("http://localhost/api/search?q=a&q=b"),
      productionRegistry,
      resolveModuleStatus,
    );
    expect(response.status).toBe(400);
    if (response.status === 400) expect(response.body.code).toBe("invalid-query");
  });

  it(`rejects queries longer than ${MAX_QUERY_LENGTH} characters`, () => {
    const response = handleSearchRequest(
      url(`?q=${"a".repeat(MAX_QUERY_LENGTH + 1)}`),
      productionRegistry,
      resolveModuleStatus,
    );
    expect(response.status).toBe(400);
  });

  it("accepts exactly 128 characters", () => {
    const response = handleSearchRequest(
      url(`?q=${"a".repeat(MAX_QUERY_LENGTH)}`),
      productionRegistry,
      resolveModuleStatus,
    );
    expect(response.status).toBe(200);
  });

  it("rejects control characters as malformed input", () => {
    const parsed = parseSearchQuery(new URLSearchParams("q=abc%00def"));
    expect(parsed.ok).toBe(false);
  });

  it("returns empty results for an empty query and for no q parameter", () => {
    for (const target of ["http://localhost/api/search", "http://localhost/api/search?q=", "http://localhost/api/search?q=%20%20"]) {
      const response = handleSearchRequest(new URL(target), productionRegistry, resolveModuleStatus);
      expect(response.status).toBe(200);
      if (response.status === 200) {
        expect(response.body.count).toBe(0);
        expect(response.body.results).toEqual([]);
      }
    }
  });

  it("returns 200 with empty results for an unknown query", () => {
    const response = search("zzzz-no-such-model-zzzz");
    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.count).toBe(0);
    }
  });
});

describe("ranking", () => {
  it("ranks an exact Gaussian title match first", () => {
    const response = search("Gaussian (Normal)");
    expect(response.status).toBe(200);
    if (response.status !== 200) return;
    expect(response.body.results[0]?.id).toBe("gaussian-normal");
    expect(response.body.results[0]?.matchedOn).toBe("title");
    expect(response.body.results[0]?.status).toBe("partial");
    expect(response.body.results[0]?.url).toBe("/models/gaussian-normal");
  });

  it("resolves the HMM alias and returns all three branch paths", () => {
    const response = search("Hidden Markov Models");
    expect(response.status).toBe(200);
    if (response.status !== 200) return;
    const hmm = response.body.results.find((result) => result.id === "hidden-markov-models-hmm");
    expect(hmm).toBeDefined();
    expect(hmm?.matchedOn).toBe("alias");
    expect(hmm?.branches).toHaveLength(3);
    expect(hmm?.branches.map((branch) => branch.labels.join(" › "))).toEqual([
      "Probabilistic Graphical Models (PGM) › Directed Graphical Models",
      "Probabilistic Latent Variable Models › Discrete Latent Variable Models",
      "Sequential Probabilistic Models › Markov Models",
    ]);
  });

  it("uses placement labels as an additional search surface", () => {
    const response = search("RBM");
    expect(response.status).toBe(200);
    if (response.status !== 200) return;
    expect(response.body.results[0]?.id).toBe("restricted-boltzmann-machines");
    expect(response.body.results[0]?.matchedOn).toBe("alias");
  });

  it("ranks exact title/alias matches before prefix and substring matches", () => {
    const response = search("VAE");
    expect(response.status).toBe(200);
    if (response.status !== 200) return;
    expect(response.body.results[0]?.id).toBe("variational-autoencoder-vae");
    expect(response.body.results[0]?.matchedOn).toBe("alias");
    const positionCvae = response.body.results.findIndex((result) => result.id === "conditional-vae");
    expect(positionCvae).toBeGreaterThanOrEqual(0);
  });

  it("searches categories and returns their branch path", () => {
    const response = search("Continuous Distributions");
    expect(response.status).toBe(200);
    if (response.status !== 200) return;
    const category = response.body.results.find((result) => result.id === "continuous-distributions");
    expect(category?.type).toBe("category");
    expect(category?.url).toBe("/categories/continuous-distributions");
    expect(category?.branches[0]?.labels).toEqual([
      "Probability Distribution Models",
      "Continuous Distributions",
    ]);
  });

  it("deduplicates canonical modules", () => {
    const response = search("variational autoencoder");
    expect(response.status).toBe(200);
    if (response.status !== 200) return;
    const ids = response.body.results.map((result) => result.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => id === "variational-autoencoder-vae")).toHaveLength(1);
  });

  it("caps results at 20 deterministically", () => {
    const first = searchRegistry(productionRegistry, "a", resolveModuleStatus);
    const second = searchRegistry(productionRegistry, "a", resolveModuleStatus);
    expect(first.length).toBeLessThanOrEqual(SEARCH_LIMIT);
    expect(first.length).toBe(SEARCH_LIMIT);
    expect(second).toEqual(first);
  });

  it("never exposes internal file paths or taxonomy file names", () => {
    const response = search("Gaussian");
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toMatch(/\/Users\//);
    expect(serialized).not.toMatch(/registry\/baseline/);
    expect(serialized).not.toMatch(/\.json/);
    expect(serialized).not.toMatch(/node_modules/);
  });
});
