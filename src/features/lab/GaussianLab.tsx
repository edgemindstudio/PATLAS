"use client";

import { useMemo, useRef, useState } from "react";
import {
  DEFAULT_GAUSSIAN_SNAPSHOT,
  GAUSSIAN_DISPLAY_DOMAIN,
  GAUSSIAN_LAB_BOUNDS,
  formatNumber,
  sampleGaussianCurve,
  summarizeGaussian,
  validateGaussianLabParams,
  type GaussianParams,
} from "@/science/gaussian";
import {
  GAUSSIAN_PYTHON_FILENAME,
  buildGaussianPythonSource,
} from "@/science/gaussianPython";
import styles from "./GaussianLab.module.css";

const PLOT = {
  width: 760,
  height: 400,
  top: 24,
  right: 24,
  bottom: 56,
  left: 68,
  yMax: 0.9,
} as const;

const PARAM_LABELS: Record<keyof GaussianParams, string> = {
  mu: "Mean μ",
  sigma: "Standard deviation σ",
};

const UNIT: Record<keyof GaussianParams, string> = {
  mu: "x units",
  sigma: "x units",
};

export function GaussianLab() {
  const [params, setParams] = useState<GaussianParams>({
    mu: DEFAULT_GAUSSIAN_SNAPSHOT.mu,
    sigma: DEFAULT_GAUSSIAN_SNAPSHOT.sigma,
  });
  const [draft, setDraft] = useState({
    mu: String(DEFAULT_GAUSSIAN_SNAPSHOT.mu),
    sigma: String(DEFAULT_GAUSSIAN_SNAPSHOT.sigma),
  });
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "manual" | "error">("idle");
  const sourceRef = useRef<HTMLTextAreaElement>(null);

  const domain = GAUSSIAN_DISPLAY_DOMAIN;
  const summary = useMemo(() => summarizeGaussian(params), [params]);
  const curve = useMemo(() => sampleGaussianCurve(params, domain), [params, domain]);
  const source = useMemo(
    () =>
      buildGaussianPythonSource({
        mu: params.mu,
        sigma: params.sigma,
        domain: { ...domain },
      }),
    [params, domain],
  );

  const xScale = (x: number) =>
    PLOT.left + ((x - domain.min) / (domain.max - domain.min)) * (PLOT.width - PLOT.left - PLOT.right);
  const yScale = (y: number) =>
    PLOT.height - PLOT.bottom - (y / PLOT.yMax) * (PLOT.height - PLOT.top - PLOT.bottom);

  const curvePath = curve
    .map((point, index) => `${index === 0 ? "M" : "L"}${xScale(point.x).toFixed(2)},${yScale(point.y).toFixed(2)}`)
    .join(" ");

  const applyParams = (next: GaussianParams): boolean => {
    const validation = validateGaussianLabParams(next);
    if (!validation.ok) {
      setError(validation.errors.join(" "));
      return false;
    }
    setParams(validation.value);
    setError(null);
    return true;
  };

  const onSlider = (field: keyof GaussianParams, value: string) => {
    const next = Number(value);
    setDraft((current) => ({ ...current, [field]: value }));
    if (applyParams({ ...params, [field]: next })) {
      setDraft((current) => ({ ...current, [field]: String(next) }));
    }
  };

  const onNumberInput = (field: keyof GaussianParams, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    if (value.trim() === "") {
      setError("Enter a numeric value.");
      return;
    }
    const next = Number(value);
    if (!Number.isFinite(next)) {
      setError("Enter a finite numeric value.");
      return;
    }
    if (applyParams({ ...params, [field]: next })) {
      setDraft((current) => ({ ...current, [field]: String(next) }));
    }
  };

  const reset = () => {
    setParams({ mu: DEFAULT_GAUSSIAN_SNAPSHOT.mu, sigma: DEFAULT_GAUSSIAN_SNAPSHOT.sigma });
    setDraft({ mu: "0", sigma: "1" });
    setError(null);
    setCopyStatus("idle");
  };

  const copySource = async () => {
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(source);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("manual");
      window.setTimeout(() => {
        sourceRef.current?.focus();
        sourceRef.current?.select();
      }, 0);
    }
  };

  const downloadSource = () => {
    const blob = new Blob([source], { type: "text/x-python;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = GAUSSIAN_PYTHON_FILENAME;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  const xTicks = [-12, -8, -4, 0, 4, 8, 12];
  const yTicks = [0, 0.2, 0.4, 0.6, 0.8];
  const bandLeft = xScale(params.mu - params.sigma);
  const bandRight = xScale(params.mu + params.sigma);

  return (
    <section className={styles.lab} aria-labelledby="gaussian-lab-heading" id="lab">
      <div className={styles.labHeader}>
        <div>
          <p className="kicker">Interactive laboratory</p>
          <h2 id="gaussian-lab-heading">Gaussian density explorer</h2>
          <p className={styles.labIntro}>
            One parameter snapshot drives the plot, equations, statistics and exported Python
            source. No observations are simulated.
          </p>
        </div>
        <button type="button" className="button button-small" onClick={reset} data-testid="reset-lab">
          Reset to defaults
        </button>
      </div>

      <div className={styles.layout}>
        <figure className={styles.figure}>
          <svg
            viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
            className={styles.plot}
            role="img"
            aria-labelledby="gaussian-plot-title gaussian-plot-desc"
            data-testid="gaussian-plot"
          >
            <title id="gaussian-plot-title">
              {`Gaussian probability density for mean ${formatNumber(params.mu, 2)} and standard deviation ${formatNumber(params.sigma, 2)}`}
            </title>
            <desc id="gaussian-plot-desc">
              {`A symmetric bell curve peaking at the mean with density ${formatNumber(summary.peakDensity, 4)}. The shaded band between mu minus sigma and mu plus sigma contains about 68.27 percent of the probability. The x-axis is a finite display window from minus 12 to 12.`}
            </desc>

            {yTicks.map((tick) => (
              <g key={`y-${tick}`}>
                <line
                  x1={PLOT.left}
                  x2={PLOT.width - PLOT.right}
                  y1={yScale(tick)}
                  y2={yScale(tick)}
                  className={styles.grid}
                />
                <text x={PLOT.left - 10} y={yScale(tick) + 4} textAnchor="end" className={styles.tick}>
                  {tick.toFixed(1)}
                </text>
              </g>
            ))}
            {xTicks.map((tick) => (
              <g key={`x-${tick}`}>
                <line
                  x1={xScale(tick)}
                  x2={xScale(tick)}
                  y1={PLOT.top}
                  y2={PLOT.height - PLOT.bottom}
                  className={styles.grid}
                />
                <text
                  x={xScale(tick)}
                  y={PLOT.height - PLOT.bottom + 22}
                  textAnchor="middle"
                  className={styles.tick}
                >
                  {tick}
                </text>
              </g>
            ))}

            <rect
              x={bandLeft}
              y={PLOT.top}
              width={Math.max(0, bandRight - bandLeft)}
              height={PLOT.height - PLOT.top - PLOT.bottom}
              className={styles.band}
            />

            <path d={curvePath} className={styles.curve} />

            <line
              x1={xScale(params.mu)}
              x2={xScale(params.mu)}
              y1={PLOT.top}
              y2={PLOT.height - PLOT.bottom}
              className={styles.meanLine}
            />
            <circle
              cx={xScale(params.mu)}
              cy={yScale(summary.peakDensity)}
              r={5}
              className={styles.peak}
            />

            <line
              x1={PLOT.left}
              x2={PLOT.width - PLOT.right}
              y1={PLOT.height - PLOT.bottom}
              y2={PLOT.height - PLOT.bottom}
              className={styles.axis}
            />
            <line
              x1={PLOT.left}
              x2={PLOT.left}
              y1={PLOT.top}
              y2={PLOT.height - PLOT.bottom}
              className={styles.axis}
            />
            <text
              x={(PLOT.left + PLOT.width - PLOT.right) / 2}
              y={PLOT.height - 12}
              textAnchor="middle"
              className={styles.axisLabel}
            >
              x (units)
            </text>
            <text
              transform={`translate(18 ${(PLOT.top + PLOT.height - PLOT.bottom) / 2}) rotate(-90)`}
              textAnchor="middle"
              className={styles.axisLabel}
            >
              f(x) — probability density
            </text>
            <text
              x={xScale(params.mu)}
              y={PLOT.top - 8}
              textAnchor="middle"
              className={styles.annotation}
            >
              μ = {formatNumber(params.mu, 2)}
            </text>
            <text
              x={bandRight + 8}
              y={PLOT.top + 18}
              className={styles.annotation}
            >
              μ ± σ ≈ 68.27%
            </text>
          </svg>
          <figcaption className={styles.figcaption}>
            Density curve over the fixed display window x ∈ [−12, 12]. The distribution is
            unbounded; the curve continues toward zero outside this window. The window is a
            display choice, not proof of exact normalization.
          </figcaption>
        </figure>

        <div className={styles.controls}>
          <h3 className={styles.controlsTitle}>Parameters</h3>
          {(Object.keys(PARAM_LABELS) as Array<keyof GaussianParams>).map((field) => {
            const bounds = GAUSSIAN_LAB_BOUNDS[field];
            const inputId = `gaussian-${field}`;
            const helpId = `${inputId}-help`;
            return (
              <div className={styles.control} key={field}>
                <div className={styles.controlTop}>
                  <label htmlFor={inputId}>{PARAM_LABELS[field]}</label>
                  <input
                    className={styles.numberInput}
                    type="number"
                    inputMode="decimal"
                    min={bounds.min}
                    max={bounds.max}
                    step={bounds.step}
                    value={draft[field]}
                    onChange={(event) => onNumberInput(field, event.target.value)}
                    aria-label={`${PARAM_LABELS[field]} numeric input`}
                    aria-describedby={helpId}
                    data-testid={`${field}-number`}
                  />
                </div>
                <input
                  id={inputId}
                  className={styles.slider}
                  type="range"
                  min={bounds.min}
                  max={bounds.max}
                  step={bounds.step}
                  value={params[field]}
                  onChange={(event) => onSlider(field, event.target.value)}
                  aria-valuetext={`${params[field]} ${UNIT[field]}`}
                  data-testid={`${field}-slider`}
                />
                <p className={styles.help} id={helpId}>
                  Range {bounds.min} to {bounds.max}, step {bounds.step} {UNIT[field]}. Use arrow
                  keys when the slider is focused.
                </p>
              </div>
            );
          })}

          {error ? (
            <p className={styles.error} role="alert" data-testid="param-error">
              {error} The plot keeps the last valid snapshot.
            </p>
          ) : null}

          <div className={styles.equation} data-testid="dynamic-equation">
            <p className={styles.equationLine}>
              f(x) = [1 / ({formatNumber(params.sigma, 2)} √(2π))] · exp( −(x −{" "}
              {formatNumber(params.mu, 2)})² / (2 · {formatNumber(params.sigma, 2)}²) )
            </p>
            <p className={styles.equationMeta}>
              E[X] = μ = {formatNumber(summary.mean, 2)} · Var(X) = σ² ={" "}
              {formatNumber(summary.variance, 2)}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.statsWrap}>
        <table className={styles.stats} data-testid="lab-statistics">
          <caption>Numeric summary for the current snapshot (density is not probability)</caption>
          <tbody>
            <tr>
              <th scope="row">Mean μ</th>
              <td data-testid="stat-mean">{formatNumber(summary.mean, 2)}</td>
              <th scope="row">Variance σ²</th>
              <td data-testid="stat-variance">{formatNumber(summary.variance, 2)}</td>
            </tr>
            <tr>
              <th scope="row">Std. deviation σ</th>
              <td data-testid="stat-sigma">{formatNumber(summary.sigma, 2)}</td>
              <th scope="row">Peak density f(μ)</th>
              <td data-testid="stat-peak">{formatNumber(summary.peakDensity, 4)}</td>
            </tr>
            <tr>
              <th scope="row">Density f(0)</th>
              <td>{formatNumber(summary.densityAtZero, 4)}</td>
              <th scope="row">Density f(μ + σ)</th>
              <td>{formatNumber(summary.densityAtMeanPlusSigma, 4)}</td>
            </tr>
            <tr>
              <th scope="row">P(μ ± 1σ)</th>
              <td>68.27%</td>
              <th scope="row">P(μ ± 2σ)</th>
              <td>95.45%</td>
            </tr>
            <tr>
              <th scope="row">P(μ ± 3σ)</th>
              <td>99.73%</td>
              <th scope="row">Display window</th>
              <td>[−12, 12]</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.codeSection} id="lab-code">
        <div className={styles.codeHeader}>
          <div>
            <h3 className={styles.controlsTitle}>Python source for this snapshot</h3>
            <p className={styles.help}>
              Download or copy a standalone script using NumPy, SciPy and Matplotlib. Python does
              not run in the browser.
            </p>
          </div>
          <div className={styles.codeActions}>
            <button
              type="button"
              className="button button-small button-primary"
              onClick={downloadSource}
              data-testid="download-python"
            >
              Download .py
            </button>
            <button
              type="button"
              className="button button-small"
              onClick={copySource}
              data-testid="copy-python"
            >
              Copy source
            </button>
          </div>
        </div>

        <p className="visually-hidden" role="status" aria-live="polite">
          {copyStatus === "copied"
            ? "Source copied to the clipboard."
            : copyStatus === "manual"
              ? "Clipboard access failed. The source is selected in a text area for manual copying."
              : copyStatus === "error"
                ? "Copy failed."
                : ""}
        </p>
        {copyStatus === "copied" ? (
          <p className={styles.copyOk}>Copied to the clipboard.</p>
        ) : null}
        {copyStatus === "manual" ? (
          <div className={styles.manualCopy}>
            <p className={styles.error} role="alert">
              Clipboard access failed. Select the source below and copy it manually.
            </p>
            <label htmlFor="manual-source" className={styles.help}>
              Manual copy area
            </label>
            <textarea
              id="manual-source"
              ref={sourceRef}
              className={styles.sourceArea}
              readOnly
              value={source}
              rows={10}
              data-testid="manual-copy-area"
            />
          </div>
        ) : null}

        <details className={styles.sourceDetails}>
          <summary>Preview generated source (reproduces parameter snapshot and display domain)</summary>
          <pre className="code-block" data-testid="python-source-preview">
            {source}
          </pre>
        </details>
      </div>
    </section>
  );
}
