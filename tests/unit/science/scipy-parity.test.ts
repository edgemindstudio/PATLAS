import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { gaussianPdf } from "@/science/gaussian";

const PYTHON = path.join(process.cwd(), ".venv", "bin", "python");
const REFERENCE = path.join(process.cwd(), "python", "reference", "gaussian_reference.py");
const EVIDENCE_DIR = path.join(process.cwd(), "evidence", "correction");

interface ReferenceCase {
  mu: number;
  sigma: number;
  values: number[];
  normalization_error: number;
}

interface RequestedCase {
  mu: number;
  sigma: number;
  xs: number[];
}

/** Approved PDF parity tolerance from the M001 scientific contract. */
const TOLERANCE_ABSOLUTE = 1e-10;
const TOLERANCE_RELATIVE = 1e-8;
/** Approved numerical normalization tolerance. */
const NORMALIZATION_TOLERANCE = 1e-6;

function referenceValues(cases: RequestedCase[]): ReferenceCase[] {
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
  let parsed: unknown;
  try {
    parsed = JSON.parse(run.stdout);
  } catch {
    throw new Error(`SciPy reference returned invalid JSON: ${run.stdout.slice(0, 200)}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error("SciPy reference response is not an array");
  }
  return parsed as ReferenceCase[];
}

function linspace(min: number, max: number, count: number): number[] {
  const values: number[] = [];
  const steps = count - 1;
  for (let index = 0; index < count; index += 1) {
    values.push(min + ((max - min) * index) / steps);
  }
  return values;
}

/**
 * Assert the reference response is complete and structurally valid before any
 * numerical comparison (RF-012): exact case count, exact per-case value count,
 * requested parameter/point correspondence and finite, non-negative data.
 */
function assertCompleteReference(reference: ReferenceCase[], cases: RequestedCase[]): void {
  expect(reference).toHaveLength(cases.length);

  reference.forEach((result, caseIndex) => {
    const requested = cases[caseIndex]!;
    expect(result).toHaveProperty("mu");
    expect(result).toHaveProperty("sigma");
    expect(result).toHaveProperty("values");
    expect(result.mu).toBe(requested.mu);
    expect(result.sigma).toBe(requested.sigma);
    expect(Array.isArray(result.values)).toBe(true);
    expect(result.values).toHaveLength(requested.xs.length);
    expect(Number.isFinite(result.normalization_error)).toBe(true);
    result.values.forEach((value, valueIndex) => {
      expect(
        Number.isFinite(value),
        `non-finite reference value at case ${caseIndex}, index ${valueIndex}`,
      ).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    });
  });
}

function writeEvidence(name: string, payload: unknown): void {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  writeFileSync(path.join(EVIDENCE_DIR, name), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
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

    const cases: RequestedCase[] = parameters.map(([mu, sigma]) => {
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

    // Exact counts are governed values, not incidental outcomes.
    expect(cases).toHaveLength(6);
    expect(cases.every((entry) => entry.xs.length === 53)).toBe(true);
    const expectedComparisons = cases.reduce((total, entry) => total + entry.xs.length, 0);
    expect(expectedComparisons).toBe(318);

    const reference = referenceValues(cases);
    assertCompleteReference(reference, cases);

    let maxAbsoluteError = 0;
    let maxRelativeError = 0;
    let comparedValues = 0;
    const diagnostics = reference.map((result, caseIndex) => {
      const expectedCase = cases[caseIndex]!;
      let caseMaxAbsolute = 0;
      let caseMaxRelative = 0;

      result.values.forEach((referenceValue, index) => {
        const x = expectedCase.xs[index]!;
        const actual = gaussianPdf(x, expectedCase.mu, expectedCase.sigma);
        const absoluteError = Math.abs(actual - referenceValue);
        const allowed = TOLERANCE_ABSOLUTE + TOLERANCE_RELATIVE * Math.abs(referenceValue);

        caseMaxAbsolute = Math.max(caseMaxAbsolute, absoluteError);
        if (referenceValue !== 0) {
          caseMaxRelative = Math.max(
            caseMaxRelative,
            absoluteError / Math.abs(referenceValue),
          );
        }
        maxAbsoluteError = Math.max(maxAbsoluteError, absoluteError);
        maxRelativeError = Math.max(maxRelativeError, caseMaxRelative);
        comparedValues += 1;

        expect(
          absoluteError,
          `mu=${expectedCase.mu} sigma=${expectedCase.sigma} x=${x} actual=${actual} reference=${referenceValue}`,
        ).toBeLessThanOrEqual(allowed);
      });

      return {
        mu: expectedCase.mu,
        sigma: expectedCase.sigma,
        comparedValues: result.values.length,
        maxAbsoluteError: caseMaxAbsolute,
        maxRelativeError: caseMaxRelative,
      };
    });

    expect(comparedValues).toBe(expectedComparisons);

    // Measured values are diagnostics required by RF-005/RF-012. They are not
    // additional scientific acceptance thresholds; the approved per-value
    // tolerance above is the only hard PDF assertion.
    const evidence = {
      generatedBy: "tests/unit/science/scipy-parity.test.ts",
      measuredAt: new Date().toISOString(),
      approvedPdfTolerance: "abs <= 1e-10 + 1e-8 * abs(reference)",
      approvedNormalizationTolerance: NORMALIZATION_TOLERANCE,
      caseCount: reference.length,
      valuesPerCase: cases[0]!.xs.length,
      comparisonCount: comparedValues,
      maxAbsoluteError,
      maxRelativeError,
      cases: diagnostics,
    };
    writeEvidence("scipy-parity.json", evidence);
    console.info("[RF-012] SciPy PDF parity", JSON.stringify({
      caseCount: evidence.caseCount,
      comparisonCount: comparedValues,
      maxAbsoluteError,
      maxRelativeError,
    }));
  });

  it("normalises over mu +/- 10 sigma with SciPy quadrature", () => {
    const normalizationCases: RequestedCase[] = [
      { mu: 0, sigma: 1, xs: [0] },
      { mu: -3, sigma: 0.5, xs: [-3] },
      { mu: 3, sigma: 2.5, xs: [3] },
    ];
    expect(normalizationCases).toHaveLength(3);

    const reference = referenceValues(normalizationCases);
    assertCompleteReference(reference, normalizationCases);

    const measurements = reference.map((result) => {
      expect(result.values).toHaveLength(1);
      expect(result.normalization_error).toBeGreaterThanOrEqual(0);
      expect(result.normalization_error).toBeLessThanOrEqual(NORMALIZATION_TOLERANCE);
      return {
        mu: result.mu,
        sigma: result.sigma,
        normalizationAbsoluteError: result.normalization_error,
      };
    });

    const maxNormalizationError = Math.max(
      ...measurements.map((measurement) => measurement.normalizationAbsoluteError),
    );
    writeEvidence("scipy-normalization.json", {
      generatedBy: "tests/unit/science/scipy-parity.test.ts",
      measuredAt: new Date().toISOString(),
      approvedNormalizationTolerance: NORMALIZATION_TOLERANCE,
      caseCount: measurements.length,
      maxNormalizationAbsoluteError: maxNormalizationError,
      cases: measurements,
    });
    console.info("[RF-012] SciPy normalization", JSON.stringify({
      caseCount: measurements.length,
      maxNormalizationError,
    }));
  });
});
