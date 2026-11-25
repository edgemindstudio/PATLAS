import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_GAUSSIAN_SNAPSHOT,
  gaussianPdf,
  type GaussianSnapshot,
} from "@/science/gaussian";
import {
  GAUSSIAN_PYTHON_FILENAME,
  buildGaussianPythonSource,
} from "@/science/gaussianPython";

const PYTHON = path.join(process.cwd(), ".venv", "bin", "python");

interface PythonSummary {
  mu: number;
  sigma: number;
  mean: number;
  variance: number;
  peak_density: number;
  density_at_mean: number;
  display_domain: { min: number; max: number; samples: number };
  curve: Array<{ x: number; y: number }>;
}

function executeExport(snapshot: GaussianSnapshot, extraArgs: string[] = ["--json"]) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "patlas-gaussian-"));
  const scriptPath = path.join(directory, GAUSSIAN_PYTHON_FILENAME);
  writeFileSync(scriptPath, buildGaussianPythonSource(snapshot), "utf8");
  const run = spawnSync(PYTHON, [scriptPath, ...extraArgs], {
    encoding: "utf8",
    timeout: 120_000,
    cwd: directory,
  });
  return { directory, scriptPath, run };
}

describe("exported Python source", () => {
  const snapshots: Array<{ name: string; snapshot: GaussianSnapshot }> = [
    { name: "default", snapshot: DEFAULT_GAUSSIAN_SNAPSHOT },
    {
      name: "lower-boundary",
      snapshot: { mu: -3, sigma: 0.5, domain: { min: -12, max: 12, samples: 601 } },
    },
    {
      name: "upper-boundary",
      snapshot: { mu: 3, sigma: 2.5, domain: { min: -12, max: 12, samples: 601 } },
    },
    {
      name: "asymmetric-domain",
      snapshot: { mu: 1.4, sigma: 0.8, domain: { min: -6, max: 9, samples: 301 } },
    },
  ];

  for (const { name, snapshot } of snapshots) {
    it(`reproduces the ${name} snapshot with SciPy`, () => {
      const { directory, run } = executeExport(snapshot);
      try {
        if (run.error) {
          throw new Error(
            `Unable to execute ${PYTHON}. Run "npm run setup:python" first. ${run.error.message}`,
          );
        }
        expect(run.status, run.stderr).toBe(0);
        const summary = JSON.parse(run.stdout) as PythonSummary;

        expect(summary.mu).toBe(snapshot.mu);
        expect(summary.sigma).toBe(snapshot.sigma);
        expect(summary.mean).toBe(snapshot.mu);
        expect(summary.variance).toBeCloseTo(snapshot.sigma ** 2, 12);
        expect(summary.peak_density).toBeCloseTo(
          1 / (snapshot.sigma * Math.sqrt(2 * Math.PI)),
          12,
        );
        expect(summary.density_at_mean).toBeCloseTo(
          gaussianPdf(snapshot.mu, snapshot.mu, snapshot.sigma),
          12,
        );
        expect(summary.display_domain).toEqual({
          min: snapshot.domain.min,
          max: snapshot.domain.max,
          samples: snapshot.domain.samples,
        });
        expect(summary.curve).toHaveLength(snapshot.domain.samples);

        let maxError = 0;
        summary.curve.forEach((point, index) => {
          const expectedX =
            snapshot.domain.min +
            ((snapshot.domain.max - snapshot.domain.min) * index) /
              (snapshot.domain.samples - 1);
          expect(point.x).toBeCloseTo(expectedX, 10);
          const actual = gaussianPdf(point.x, snapshot.mu, snapshot.sigma);
          maxError = Math.max(maxError, Math.abs(actual - point.y));
        });
        expect(maxError).toBeLessThanOrEqual(1e-12);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });
  }

  it("contains the current parameters, domain and dependency instructions", () => {
    const snapshot: GaussianSnapshot = {
      mu: -1.2,
      sigma: 2.3,
      domain: { min: -10, max: 14, samples: 101 },
    };
    const source = buildGaussianPythonSource(snapshot);
    expect(source).toContain("MU = -1.2");
    expect(source).toContain("SIGMA = 2.3");
    expect(source).toContain("X_MIN = -10.0");
    expect(source).toContain("X_MAX = 14.0");
    expect(source).toContain("SAMPLES = 101");
    expect(source).toContain("numpy==2.5.5");
    expect(source).toContain("scipy==1.18.1");
    expect(source).toContain("matplotlib==3.11.2");
    expect(source).toContain("scipy.stats");
    expect(source).not.toContain("${");
  });

  it("writes a plot from the same snapshot", () => {
    const { directory, run } = executeExport(DEFAULT_GAUSSIAN_SNAPSHOT, [
      "--json",
      "--plot",
      "gaussian.png",
    ]);
    try {
      expect(run.status, run.stderr).toBe(0);
      const plotPath = path.join(directory, "gaussian.png");
      expect(existsSync(plotPath)).toBe(true);
      expect(statSync(plotPath).size).toBeGreaterThan(1_000);
      const summary = JSON.parse(run.stdout) as PythonSummary;
      expect(summary.curve).toHaveLength(601);
      expect(readFileSync(plotPath).subarray(1, 4).toString("ascii")).toBe("PNG");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rejects invalid snapshots before generating source", () => {
    expect(() =>
      buildGaussianPythonSource({ mu: 0, sigma: 0, domain: { min: -1, max: 1, samples: 10 } }),
    ).toThrow(RangeError);
    expect(() =>
      buildGaussianPythonSource({
        mu: 0,
        sigma: 1,
        domain: { min: 2, max: 1, samples: 10 },
      }),
    ).toThrow(RangeError);
  });
});
