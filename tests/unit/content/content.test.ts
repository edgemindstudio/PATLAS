import { describe, expect, it } from "vitest";
import { renderMarkdown, renderSections } from "@/server/content/markdown";
import { getGaussianLesson, resolveModuleStatus } from "@/server/content/lessons";
import { productionRegistry } from "../helpers/registry";

describe("Markdown sanitisation", () => {
  it("renders ordinary Markdown structure", () => {
    const html = renderMarkdown("# Ignored h1\n\n## Section\n\n- one\n- two\n\n| a | b |\n| - | - |\n| 1 | 2 |");
    expect(html).toContain("<h2>Section</h2>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<table>");
  });

  it("removes scripts, event handlers, iframes and unsafe schemes", () => {
    const html = renderMarkdown(
      '<script>alert(1)</script>\n\n<img src="x" onerror="alert(2)">\n\n[bad](javascript:alert(3))\n\n[good](https://example.org)\n\n<iframe src="https://example.org"></iframe>',
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="https://example.org"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("keeps semantic details/summary blocks used by knowledge checks", () => {
    const html = renderMarkdown("<details><summary>Answers</summary>\n\nText\n\n</details>");
    expect(html).toContain("<details>");
    expect(html).toContain("<summary>Answers</summary>");
  });
});

describe("Gaussian lesson content", () => {
  const lesson = getGaussianLesson();

  it("covers every applicable MODEL_MODULE_SPEC section", () => {
    const required = [
      "definition",
      "motivation",
      "visual-intuition",
      "structure",
      "notation-equations",
      "derivation",
      "fitting-inference-sampling",
      "code",
      "applications",
      "assumptions-limitations",
      "knowledge-check",
    ];
    const ids = lesson.sections.map((section) => section.id);
    for (const id of required) expect(ids, `missing section ${id}`).toContain(id);
    expect(lesson.missingSections).toEqual([]);
  });

  it("renders every section without executable markup", () => {
    const rendered = renderSections(lesson.sections);
    expect(rendered).toHaveLength(lesson.sections.length);
    for (const section of rendered) {
      expect(section.html.length).toBeGreaterThan(100);
      expect(section.html).not.toMatch(/<script|onerror|javascript:/i);
    }
  });

  it("is attached to a real registry module and remains partial", () => {
    expect(productionRegistry.modules.some((module) => module.id === lesson.id)).toBe(true);
    expect(lesson.status).toBe("partial");
    expect(resolveModuleStatus(lesson.id)).toBe("partial");
    expect(lesson.statusNote).toMatch(/not accepted/i);
  });

  it("provides reliable, cited references for the scientific claims", () => {
    expect(lesson.references.length).toBeGreaterThanOrEqual(5);
    for (const reference of lesson.references) {
      expect(reference.url).toMatch(/^https:\/\//);
      expect(reference.title.length).toBeGreaterThan(5);
      expect(reference.supports.length).toBeGreaterThan(10);
    }
    const combined = lesson.references.map((reference) => reference.url).join(" ");
    expect(combined).toContain("scipy");
    expect(combined).toContain("nist.gov");
  });

  it("discloses sampling, fitting and graph limitations instead of faking them", () => {
    const prose = lesson.sections.map((section) => section.markdown).join("\n");
    expect(prose).toMatch(/maximum likelihood estimator|maximum likelihood/i);
    expect(prose).toMatch(/denominator \*\*n\*\*/);
    expect(prose).toMatch(/not generate observations/i);
    expect(lesson.disclosures.join(" ")).toMatch(/relationship graph is planned/i);
  });

  it("links related models that exist in the frozen registry", () => {
    const ids = new Set(productionRegistry.modules.map((module) => module.id));
    for (const related of lesson.relatedModels) {
      expect(ids.has(related), `related model ${related}`).toBe(true);
    }
  });
});

describe("Gaussian lesson scientific qualifications (RF-007)", () => {
  const lesson = getGaussianLesson();
  const prose = lesson.sections.map((section) => section.markdown).join("\n");

  it("qualifies the linear transformation for zero slope and nondegenerate Gaussians", () => {
    const structure = lesson.sections.find((section) => section.id === "structure")!;
    expect(structure.markdown).toMatch(/nondegenerate Gaussian/);
    expect(structure.markdown).toMatch(/a ≠ 0/);
    expect(structure.markdown).toMatch(/a = 0/);
    expect(structure.markdown).toMatch(/constant b/);
    expect(structure.markdown).toMatch(/not a positive-variance Gaussian/);
  });

  it("states the iid, nondegenerate-sample and n > 1 maximum-likelihood conditions", () => {
    expect(prose).toMatch(/independent and identically distributed \(iid\)/);
    expect(prose).toMatch(/nondegenerate sample/);
    expect(prose).toMatch(/all observations is identical|every observation is identical/i);
    expect(prose).toMatch(/no finite maximum/);
    expect(prose).toMatch(/\*\*n − 1\*\* and requires \*\*n > 1\*\*/);
  });

  it("distinguishes known-variance normal inference from unknown-variance t inference", () => {
    expect(prose).toMatch(/known observation variance/);
    expect(prose).toMatch(/Student's t/);
    expect(prose).toMatch(/n − 1\*\* degrees of freedom/);
    expect(prose).toMatch(/not merely a small-sample patch/);
  });

  it("qualifies the Bayesian conjugate example and separates the two samplers", () => {
    expect(prose).toMatch(/normal prior is placed on the unknown mean/);
    expect(prose).toMatch(/does not by itself establish/);
    expect(prose).toMatch(/known observation variance/);
    expect(prose).toMatch(/Inverse-CDF sampling and Box–Muller are distinct/);
    expect(prose).toMatch(/trigonometric expressions/);
  });

  it("keeps equation captions explicit about location, standard deviation and variance", () => {
    const captions = lesson.equations.map((equation) => equation.caption).join(" ");
    expect(captions).toMatch(/location μ/);
    expect(captions).toMatch(/standard deviation σ/);
    expect(captions).toMatch(/σ² is the variance/);
  });
});
