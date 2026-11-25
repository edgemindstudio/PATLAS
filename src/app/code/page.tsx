import { readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";

export const metadata = {
  title: "Code",
  description:
    "Declared environments and downloadable reference source for PATLAS probabilistic models.",
};

const LICENSES: Record<string, string> = {
  next: "MIT",
  react: "MIT",
  "react-dom": "MIT",
  typescript: "Apache-2.0",
  eslint: "MIT",
  "eslint-config-next": "MIT",
  vitest: "MIT",
  vite: "MIT",
  "@playwright/test": "Apache-2.0",
  "@axe-core/playwright": "MPL-2.0",
  katex: "MIT",
  ajv: "MIT",
  marked: "MIT",
  "sanitize-html": "MIT",
  "server-only": "MIT",
};

const PYTHON_LICENSES: Record<string, string> = {
  numpy: "BSD-3-Clause",
  scipy: "BSD-3-Clause",
  matplotlib: "PSF-based (Matplotlib licence)",
  pytest: "MIT",
};

export default function CodePage() {
  const pkg = JSON.parse(
    readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
  ) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  const requirements = readFileSync(
    path.join(process.cwd(), "python", "requirements.txt"),
    "utf8",
  )
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  const nodeDependencies = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies }).sort(
    ([a], [b]) => (a < b ? -1 : 1),
  );

  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Code · reference environment</p>
        <h1>Reproducible source, declared dependencies</h1>
        <p className="lede">
          PATLAS is MIT-licensed software with CC BY 4.0 original educational content. M001
          publishes one executable reference example: the Gaussian snapshot exporter. Python is
          never executed in the browser.
        </p>
      </header>

      <section className="card" aria-labelledby="example-heading">
        <h2 id="example-heading" style={{ marginTop: 0 }}>
          Reference example
        </h2>
        <p>
          <strong>Gaussian density snapshot</strong> — generated in the laboratory and
          downloadable as <span className="mono">patlas_gaussian_snapshot.py</span>. It reproduces
          the current μ, σ and display domain, prints machine-readable values with{" "}
          <span className="mono">--json</span>, and can save a Matplotlib figure with{" "}
          <span className="mono">--plot</span>.
        </p>
        <div className="row">
          <Link className="button button-primary" href="/labs/gaussian-normal">
            Generate current source
          </Link>
          <Link className="button" href="/models/gaussian-normal#code">
            Read the code section
          </Link>
        </div>
      </section>

      <section style={{ marginTop: "var(--space-8)" }} aria-labelledby="python-env">
        <h2 id="python-env">Isolated Python environment</h2>
        <p className="mono">.venv/bin/python -m pip install -r python/requirements.txt</p>
        <div style={{ overflowX: "auto" }}>
          <table className="data">
            <caption className="visually-hidden">Verified Python dependencies</caption>
            <thead>
              <tr>
                <th scope="col">Package</th>
                <th scope="col">Pinned version</th>
                <th scope="col">Licence</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((line) => {
                const [name, version] = line.split("==");
                return (
                  <tr key={line}>
                    <td>{name}</td>
                    <td className="mono">{version}</td>
                    <td>{PYTHON_LICENSES[name ?? ""] ?? "See project metadata"}</td>
                    <td>
                      {name === "numpy"
                        ? "Numerical arrays and grid"
                        : name === "scipy"
                          ? "Reference density and verification"
                          : name === "matplotlib"
                            ? "Optional plot output"
                            : "Python test runner"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="meta">
          The isolated environment is created locally; no dependency is installed globally and
          no sudo is used.
        </p>
      </section>

      <section style={{ marginTop: "var(--space-8)" }} aria-labelledby="node-env">
        <h2 id="node-env">Application toolchain</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="data">
            <caption className="visually-hidden">Pinned Node.js toolchain versions</caption>
            <thead>
              <tr>
                <th scope="col">Package</th>
                <th scope="col">Pinned version</th>
                <th scope="col">Licence</th>
              </tr>
            </thead>
            <tbody>
              {nodeDependencies.map(([name, version]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td className="mono">{version}</td>
                  <td>{LICENSES[name] ?? "See package metadata"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="meta">
          Exact versions are pinned in <span className="mono">package.json</span> and{" "}
          <span className="mono">package-lock.json</span>. Provenance and licence verification
          are recorded in <span className="mono">docs/current/DEPENDENCY_PROVENANCE.md</span>.
        </p>
      </section>

      <section className="notice" style={{ marginTop: "var(--space-8)" }}>
        <strong>No arbitrary execution.</strong> The application exposes no code runner, no remote
        Python endpoint and no editable browser execution. Download the source and run it in the
        declared environment.
      </section>
    </div>
  );
}
