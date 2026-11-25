import { describe, expect, it } from "vitest";
import {
  DEFAULT_GAUSSIAN_SNAPSHOT,
  GAUSSIAN_DISPLAY_DOMAIN,
  GAUSSIAN_LAB_BOUNDS,
  gaussianMean,
  gaussianPdf,
  gaussianPeakDensity,
  gaussianVariance,
  sampleGaussianCurve,
  summarizeGaussian,
  validateGaussianLabParams,
  validateGaussianParams,
  validateGaussianSnapshot,
} from "@/science/gaussian";

function simpsonIntegral(
  fn: (x: number) => number,
  min: number,
  max: number,
  intervals: number,
): number {
  if (intervals % 2 !== 0) throw new Error("Simpson's rule needs an even number of intervals");
  const h = (max - min) / intervals;
  let sum = fn(min) + fn(max);
  for (let index = 1; index < intervals; index += 1) {
    sum += (index % 2 === 0 ? 2 : 4) * fn(min + index * h);
  }
  return (h / 3) * sum;
}

describe("Gaussian density", () => {
  it("matches the closed-form density at the mean", () => {
    expect(gaussianPdf(0, 0, 1)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 15);
    expect(gaussianPdf(0, 0, 1)).toBeCloseTo(0.3989422804014327, 15);
    expect(gaussianPdf(2, 2, 3)).toBeCloseTo(1 / (3 * Math.sqrt(2 * Math.PI)), 15);
  });

  it("is symmetric around mu", () => {
    for (const [mu, sigma] of [
      [0, 1],
      [-3, 0.5],
      [3, 2.5],
      [0.7, 1.3],
    ] as const) {
      for (const offset of [0.1, 0.7, 2, 5]) {
        expect(gaussianPdf(mu + offset, mu, sigma)).toBeCloseTo(
          gaussianPdf(mu - offset, mu, sigma),
          14,
        );
      }
    }
  });

  it("is non-negative, underflows safely in extreme tails and never exceeds its peak", () => {
    for (const [mu, sigma] of [
      [0, 1],
      [-3, 0.5],
      [3, 2.5],
    ] as const) {
      const peak = gaussianPeakDensity({ mu, sigma });
      expect(peak).toBeCloseTo(gaussianPdf(mu, mu, sigma), 14);
      for (const x of [-100, -12, -1, 0, mu, 1, 12, 100]) {
        const value = gaussianPdf(x, mu, sigma);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeLessThanOrEqual(peak + Number.EPSILON);
      }
      // Values inside the displayed window are strictly positive; extreme
      // tails may underflow to zero in double precision.
      for (const offset of [0, 0.5, 2, 5]) {
        expect(gaussianPdf(mu + offset, mu, sigma)).toBeGreaterThan(0);
        expect(gaussianPdf(mu - offset, mu, sigma)).toBeGreaterThan(0);
      }
    }
  });

  it("has mean mu and variance sigma squared", () => {
    const params = { mu: 1.3, sigma: 0.9 };
    expect(gaussianMean(params)).toBe(1.3);
    expect(gaussianVariance(params)).toBeCloseTo(0.81, 15);
    expect(summarizeGaussian(params).variance).toBeCloseTo(0.81, 15);
  });

  it("integrates to 1 over mu +/- 10 sigma with fine quadrature", () => {
    for (const [mu, sigma] of [
      [0, 1],
      [-3, 0.5],
      [3, 2.5],
      [-1.7, 0.8],
    ] as const) {
      const integral = simpsonIntegral(
        (x) => gaussianPdf(x, mu, sigma),
        mu - 10 * sigma,
        mu + 10 * sigma,
        200_000,
      );
      expect(Math.abs(integral - 1)).toBeLessThanOrEqual(1e-6);
    }
  });

  it("discloses that the finite display window is not the support", () => {
    const points = sampleGaussianCurve({ mu: 0, sigma: 1 }, GAUSSIAN_DISPLAY_DOMAIN);
    expect(points).toHaveLength(GAUSSIAN_DISPLAY_DOMAIN.samples);
    expect(points[0]?.x).toBe(-12);
    expect(points.at(-1)?.x).toBe(12);
    expect(points[0]?.y).toBeGreaterThan(0);
    const visibleArea = simpsonIntegral(
      (x) => gaussianPdf(x, 0, 1),
      GAUSSIAN_DISPLAY_DOMAIN.min,
      GAUSSIAN_DISPLAY_DOMAIN.max,
      20_000,
    );
    expect(visibleArea).toBeLessThanOrEqual(1);
    expect(DEFAULT_GAUSSIAN_SNAPSHOT.domain.min).toBe(GAUSSIAN_DISPLAY_DOMAIN.min);
  });

  it("reports the approved default snapshot", () => {
    expect(DEFAULT_GAUSSIAN_SNAPSHOT).toEqual({
      mu: 0,
      sigma: 1,
      domain: { min: -12, max: 12, samples: 601 },
    });
    expect(GAUSSIAN_LAB_BOUNDS.mu).toEqual({ min: -3, max: 3, step: 0.1, default: 0 });
    expect(GAUSSIAN_LAB_BOUNDS.sigma).toEqual({ min: 0.5, max: 2.5, step: 0.1, default: 1 });
  });
});

describe("Gaussian parameter validation", () => {
  it("rejects non-finite and non-positive parameters", () => {
    const invalid = [
      { mu: Number.NaN, sigma: 1 },
      { mu: Number.POSITIVE_INFINITY, sigma: 1 },
      { mu: 0, sigma: 0 },
      { mu: 0, sigma: -1 },
      { mu: 0, sigma: Number.NaN },
      { mu: "0", sigma: 1 },
      { mu: 0 },
      null,
    ];
    for (const input of invalid) {
      const result = validateGaussianParams(input);
      expect(result.ok, JSON.stringify(input)).toBe(false);
    }
  });

  it("rejects parameters outside the approved laboratory control ranges", () => {
    expect(validateGaussianLabParams({ mu: 3.1, sigma: 1 }).ok).toBe(false);
    expect(validateGaussianLabParams({ mu: -3.1, sigma: 1 }).ok).toBe(false);
    expect(validateGaussianLabParams({ mu: 0, sigma: 0.4 }).ok).toBe(false);
    expect(validateGaussianLabParams({ mu: 0, sigma: 2.6 }).ok).toBe(false);
    expect(validateGaussianLabParams({ mu: 3, sigma: 0.5 }).ok).toBe(true);
    expect(validateGaussianLabParams({ mu: -3, sigma: 2.5 }).ok).toBe(true);
  });

  it("validates export snapshots", () => {
    expect(validateGaussianSnapshot(DEFAULT_GAUSSIAN_SNAPSHOT).ok).toBe(true);
    expect(
      validateGaussianSnapshot({ mu: 0, sigma: 1, domain: { min: 1, max: 1, samples: 10 } }).ok,
    ).toBe(false);
    expect(
      validateGaussianSnapshot({ mu: 0, sigma: 1, domain: { min: -1, max: 1, samples: 1 } }).ok,
    ).toBe(false);
  });

  it("throws from the density function for invalid parameters", () => {
    expect(() => gaussianPdf(0, Number.NaN, 1)).toThrow(RangeError);
    expect(() => gaussianPdf(0, 0, 0)).toThrow(RangeError);
    expect(() => gaussianPdf(Number.POSITIVE_INFINITY, 0, 1)).toThrow(RangeError);
  });
});
