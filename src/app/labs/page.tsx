import Link from "next/link";
import { loadRegistry } from "@/server/registry";
import { findModule, moduleUrl } from "@/server/registry/build";
import { resolveModuleStatus } from "@/server/content/lessons";
import { StatusBadge } from "@/ui/components/StatusBadge";

export const metadata = {
  title: "Visual Lab",
};

export default async function LabsPage() {
  const registry = await loadRegistry();
  const gaussian = findModule(registry, "gaussian-normal");

  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Visual Lab</p>
        <h1>Experiment with a model, then read the mathematics</h1>
        <p className="lede">
          M001 implements exactly one interactive laboratory: the univariate Gaussian density.
          Other laboratories are planned and are not simulated here.
        </p>
      </header>

      {gaussian ? (
        <article className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>Gaussian density explorer</h2>
            <StatusBadge status={resolveModuleStatus(gaussian.id)} />
          </div>
          <p>
            Adjust μ and σ over the approved ranges. One parameter snapshot drives the SVG
            density plot, the displayed equations, the numeric summary and the downloadable
            Python source. The display window is fixed at x ∈ [−12, 12] and disclosed.
          </p>
          <ul className="prose">
            <li>Density is shown, not probability mass.</li>
            <li>No observations are simulated.</li>
            <li>Reset returns to μ = 0, σ = 1.</li>
          </ul>
          <div className="row">
            <Link className="button button-primary" href="/labs/gaussian-normal">
              Open the laboratory
            </Link>
            <Link className="button" href={moduleUrl("gaussian-normal")}>
              Read the full lesson
            </Link>
          </div>
        </article>
      ) : null}

      <section style={{ marginTop: "var(--space-8)" }} aria-labelledby="planned-labs">
        <h2 id="planned-labs">Planned laboratories</h2>
        <p className="meta">
          No other laboratory is registered in M001. Candidate future experiments are listed in
          the approved planning package; they are not implemented and not counted as complete.
        </p>
      </section>
    </div>
  );
}
