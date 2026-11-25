import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { gaussianPdf } from "@/science/gaussian";

const PYTHON = path.join(process.cwd(), ".venv", "bin", "python");
const REFERENCE = path.join(process.cwd(), "python", "reference", "gaussian_reference.py");

interface ReferenceCase {
  mu: number;
  sigma: number;
  values: number[];
  normalization_error: number;
}

function referenceValues(
  cases: Array<{ mu: number; sigma: number; xs: number[] }>,
): ReferenceCase[] {
  const run = spawnSync(PYTHON, [REFERENCE], {
    input: JSON.stringify({ cases }),
    encoding: "utf8",
    timeout: 120_000,
  });
  if (run.error) {
    throw new Error(
      `Unable to execute ${PYTHON}. Create the isolated environment with "npm run setup:python". ${run.error.message}`,
    );
  }
  if (run.status !== 0) {
    throw new Error(`SciPy reference failed (status ${run.status}): ${run.stderr}`);
  }
  return JSON.parse(run.stdout) as ReferenceCase[];
}

const TOLERANCE_ABSOLUTE = 1e-10;
const TOLERANCE_RELATIVE = 1e-8;

function linspace(min: number, max: number, count: number): number[] {
  const values: number[] = [];
  const steps = count - 1;
  for (let index = 0; index < count; index += 1) {
    values.push(min + ((max - min) * index) / steps);
  }
  return values;
}

describe("Gaussian parity against independent SciPy reference", () => {
  it("matches scipy.stats.norm.pdf over deterministic parameter and x grids", () => {
    const parameters: Array<[number, number]> = [
      [-3, 0.5],
      [3, 2.5],
      [0, 1],
      [-3, 2.5],
      [3, 0.5],
      [0.7, 1.3],
    ];

    const cases = parameters.map(([mu, sigma]) => {
      const xs = [
        ...linspace(-12, 12, 41),
        0,
        mu,
        mu - 1e-8,
        mu + 1e-8,
        mu - sigma,
        mu + sigma,
        mu - 2 * sigma,
        mu + 2 * sigma,
        mu - 10 * sigma,
        mu + 10 * sigma,
        -12,
        12,
      ];
      return { mu, sigma, xs };
    });

    const reference = referenceValues(cases);
    let maxAbsoluteError = 0;
    let maxRelativeError = 0;
    let comparedValues = 0;

    reference.forEach((result, caseIndex) => {
      const expectedCase = cases[caseIndex]!;
      expect(result.mu).toBe(expectedCase.mu);
      expect(result.sigma).toBe(expectedCase.sigma);
      result.values.forEach((referenceValue, index) => {
        const x = expectedCase.xs[index]!;
        const actual = gaussianPdf(x, expectedCase.mu, expectedCase.sigma);
        const absoluteError = Math.abs(actual - referenceValue);
        const allowed = TOLERANCE_ABSOLUTE + TOLERANCE_RELATIVE * Math.abs(referenceValue);
        maxAbsoluteError = Math.max(maxAbsoluteError, absoluteError);
        if (referenceValue !== 0) {
          maxRelativeError = Math.max(maxRelativeError, absoluteError / Math.abs(referenceValue));
        }
        comparedValues += 1;
        expect(
          absoluteError,
          `mu=${expectedCase.mu} sigma=${expectedCase.sigma} x=${x} actual=${actual} reference=${referenceValue}`,
        ).toBeLessThanOrEqual(allowed);
      });
    });

    expect(comparedValues).toBeGreaterThanOrEqual(300);
    // Evidence is recorded for the return; the assertions are the hard gate.
    expect(maxAbsoluteError).toBeLessThanOrEqual(1e-12);
    expect(maxRelativeError).toBeLessThanOrEqual(1e-12);
  });

  it("normalises over mu +/- 10 sigma with SciPy quadrature", () => {
    const reference = referenceValues([
      { mu: 0, sigma: 1, xs: [0] },
      { mu: -3, sigma: 0.5, xs: [-3] },
      { mu: 3, sigma: 2.5, xs: [3] },
    ]);
    for (const result of reference) {
      expect(result.normalization_error).toBeLessThanOrEqual(1e-6);
    }
  });
});
