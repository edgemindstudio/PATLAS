/**
 * Univariate Gaussian science core.
 *
 * Framework-independent: no React, DOM or Next.js imports. The same functions
 * drive the SVG laboratory, the displayed statistics and the exported Python
 * snapshot so the three views cannot drift apart.
 */

export interface GaussianParams {
  mu: number;
  sigma: number;
}

export interface GaussianSnapshot extends GaussianParams {
  domain: {
    min: number;
    max: number;
    samples: number;
  };
}

export interface LabParameterBounds {
  min: number;
  max: number;
  step: number;
  default: number;
}

export const GAUSSIAN_LAB_BOUNDS: { mu: LabParameterBounds; sigma: LabParameterBounds } = {
  mu: { min: -3, max: 3, step: 0.1, default: 0 },
  sigma: { min: 0.5, max: 2.5, step: 0.1, default: 1 },
};

/** Fixed display window. This is not the support of the distribution. */
export const GAUSSIAN_DISPLAY_DOMAIN = { min: -12, max: 12, samples: 601 } as const;

export const DEFAULT_GAUSSIAN_SNAPSHOT: GaussianSnapshot = {
  mu: GAUSSIAN_LAB_BOUNDS.mu.default,
  sigma: GAUSSIAN_LAB_BOUNDS.sigma.default,
  domain: { ...GAUSSIAN_DISPLAY_DOMAIN },
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

const MAX_SAFE_MAGNITUDE = 1e6;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Mathematical validity only: mu finite, sigma finite and strictly positive. */
export function validateGaussianParams(input: unknown): ValidationResult<GaussianParams> {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["Parameters must be an object with mu and sigma."] };
  }
  const candidate = input as Partial<GaussianParams>;
  if (!isFiniteNumber(candidate.mu)) {
    errors.push("mu must be a finite number.");
  }
  if (!isFiniteNumber(candidate.sigma)) {
    errors.push("sigma must be a finite number.");
  } else if (candidate.sigma <= 0) {
    errors.push("sigma must be strictly positive.");
  }
  if (!isFiniteNumber(candidate.mu) || !isFiniteNumber(candidate.sigma)) {
    return { ok: false, errors };
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { mu: candidate.mu, sigma: candidate.sigma } };
}

/**
 * Interactive-laboratory validity: mathematical validity plus the Founder
 * approved control ranges. Used by the UI; exported source only needs the
 * mathematical constraint.
 */
export function validateGaussianLabParams(input: unknown): ValidationResult<GaussianParams> {
  const base = validateGaussianParams(input);
  if (!base.ok) return base;
  const errors: string[] = [];
  const { mu, sigma } = base.value;
  if (mu < GAUSSIAN_LAB_BOUNDS.mu.min || mu > GAUSSIAN_LAB_BOUNDS.mu.max) {
    errors.push(
      `mu must be between ${GAUSSIAN_LAB_BOUNDS.mu.min} and ${GAUSSIAN_LAB_BOUNDS.mu.max}.`,
    );
  }
  if (sigma < GAUSSIAN_LAB_BOUNDS.sigma.min || sigma > GAUSSIAN_LAB_BOUNDS.sigma.max) {
    errors.push(
      `sigma must be between ${GAUSSIAN_LAB_BOUNDS.sigma.min} and ${GAUSSIAN_LAB_BOUNDS.sigma.max}.`,
    );
  }
  if (errors.length > 0) return { ok: false, errors };
  return base;
}

export function validateGaussianSnapshot(input: unknown): ValidationResult<GaussianSnapshot> {
  const params = validateGaussianParams(input);
  if (!params.ok) return params;
  const candidate = input as Partial<GaussianSnapshot>;
  const domain = candidate.domain;
  const errors: string[] = [];
  if (
    typeof domain !== "object" ||
    domain === null ||
    !isFiniteNumber(domain.min) ||
    !isFiniteNumber(domain.max) ||
    !Number.isInteger(domain.samples)
  ) {
    errors.push("domain must contain finite min/max and an integer sample count.");
  } else {
    if (domain.min >= domain.max) errors.push("domain.min must be less than domain.max.");
    if (domain.samples < 2) errors.push("domain.samples must be at least 2.");
    if (domain.samples > 100_001) errors.push("domain.samples must not exceed 100001.");
    if (Math.abs(domain.min) > MAX_SAFE_MAGNITUDE || Math.abs(domain.max) > MAX_SAFE_MAGNITUDE) {
      errors.push("domain bounds must be within +/-1e6.");
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      mu: params.value.mu,
      sigma: params.value.sigma,
      domain: {
        min: domain!.min,
        max: domain!.max,
        samples: domain!.samples,
      },
    },
  };
}

/**
 * Probability density function of the univariate normal distribution:
 *
 *   f(x) = exp(-0.5 * ((x - mu) / sigma)^2) / (sigma * sqrt(2 * pi))
 *
 * Throws for mathematically invalid parameters.
 */
export function gaussianPdf(x: number, mu: number, sigma: number): number {
  if (!Number.isFinite(x)) throw new RangeError("x must be finite.");
  if (!Number.isFinite(mu)) throw new RangeError("mu must be finite.");
  if (!Number.isFinite(sigma) || sigma <= 0) {
    throw new RangeError("sigma must be finite and strictly positive.");
  }
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

export function gaussianPdfForParams(x: number, params: GaussianParams): number {
  return gaussianPdf(x, params.mu, params.sigma);
}

export function gaussianMean(params: GaussianParams): number {
  return params.mu;
}

export function gaussianVariance(params: GaussianParams): number {
  return params.sigma * params.sigma;
}

export function gaussianStdDev(params: GaussianParams): number {
  return params.sigma;
}

/** Density at the mode x = mu. */
export function gaussianPeakDensity(params: GaussianParams): number {
  return 1 / (params.sigma * Math.sqrt(2 * Math.PI));
}

export interface CurvePoint {
  x: number;
  y: number;
}

/** Deterministic density samples over an explicit finite display domain. */
export function sampleGaussianCurve(
  params: GaussianParams,
  domain: { min: number; max: number; samples: number } = GAUSSIAN_DISPLAY_DOMAIN,
): CurvePoint[] {
  const points: CurvePoint[] = [];
  const steps = Math.max(1, domain.samples - 1);
  for (let index = 0; index < domain.samples; index += 1) {
    const x = domain.min + ((domain.max - domain.min) * index) / steps;
    points.push({ x, y: gaussianPdf(x, params.mu, params.sigma) });
  }
  return points;
}

export interface GaussianSummary {
  mu: number;
  mean: number;
  sigma: number;
  variance: number;
  peakDensity: number;
  densityAtZero: number;
  densityAtMeanPlusSigma: number;
  intervalOneSigmaProbability: number;
  intervalTwoSigmaProbability: number;
  intervalThreeSigmaProbability: number;
}

/**
 * Displayed statistics derived from one parameter snapshot.
 *
 * The 68.27/95.45/99.73 percentages are exact statements about the normal
 * distribution, not empirical estimates from the finite plotted window.
 */
export function summarizeGaussian(params: GaussianParams): GaussianSummary {
  return {
    mu: params.mu,
    mean: gaussianMean(params),
    sigma: params.sigma,
    variance: gaussianVariance(params),
    peakDensity: gaussianPeakDensity(params),
    densityAtZero: gaussianPdf(0, params.mu, params.sigma),
    densityAtMeanPlusSigma: gaussianPdf(params.mu + params.sigma, params.mu, params.sigma),
    intervalOneSigmaProbability: 0.6826894921370859,
    intervalTwoSigmaProbability: 0.9544997361036416,
    intervalThreeSigmaProbability: 0.9973002039367398,
  };
}

/** Fixed precision for user-facing numeric display. */
export function formatNumber(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}
