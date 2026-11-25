import Link from "next/link";
import { loadRegistry } from "@/server/registry";
import { categoryUrl, findModule } from "@/server/registry/build";
import { resolveModuleStatus } from "@/server/content/lessons";
import { StatusBadge } from "@/ui/components/StatusBadge";

export const metadata = {
  title: "Home",
};

function HeroCurve() {
  const points: string[] = [];
  for (let index = 0; index <= 120; index += 1) {
    const x = -4 + (8 * index) / 120;
    const y = Math.exp(-0.5 * x * x);
    points.push(`${24 + index * 2.2},${150 - y * 110}`);
  }
  return (
    <svg
      className="hero-curve"
      viewBox="0 0 300 180"
      role="img"
      aria-label="Illustrative bell-shaped density curve on labelled axes."
    >
      <line x1="16" y1="150" x2="292" y2="150" stroke="var(--chart-axis)" strokeWidth="1.5" />
      <line x1="24" y1="24" x2="24" y2="158" stroke="var(--chart-axis)" strokeWidth="1.5" />
      <path
        d={`M${points.join(" L")}`}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="156"
        y1="34"
        x2="156"
        y2="150"
        stroke="var(--chart-3)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <text x="163" y="46" fontSize="11" fill="var(--muted)">
        μ
      </text>
      <text x="282" y="168" fontSize="11" fill="var(--muted)">
        x
      </text>
      <text x="8" y="22" fontSize="11" fill="var(--muted)">
        f(x)
      </text>
    </svg>
  );
}

export default async function HomePage() {
  const registry = await loadRegistry();
  const gaussian = findModule(registry, "gaussian-normal");

  const subtreePlacements = (id: string): number => {
    const category = registry.categories.find((item) => item.id === id);
    if (!category) return 0;
    const direct = category.placementIds.length;
    return (
      direct +
      registry.categories
        .filter((item) => item.parentId === id)
        .reduce((total, child) => total + subtreePlacements(child.id), 0)
    );
  };

  const majors = registry.categories
    .filter((category) => category.isMajor)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="page">
      <section className="home-hero">
        <div>
          <p className="kicker">PATLAS-M001 reference slice</p>
          <h1>See probability first. Then understand the mathematics.</h1>
          <p className="lede">
            PATLAS is an explorable atlas of probabilistic models. The complete Founder-approved
            taxonomy is navigable today; the Gaussian reference slice is implemented with a
            verified laboratory, lesson and reproducible Python source. Other lessons are
            honestly marked as planned.
          </p>
          <div className="row" style={{ marginTop: "var(--space-6)" }}>
            <Link className="button button-primary" href="/explorer">
              Explore the taxonomy
            </Link>
            <Link className="button" href="/models/gaussian-normal">
              Open the Gaussian slice
            </Link>
          </div>
          <p className="meta" style={{ marginTop: "var(--space-3)" }}>
            {registry.counts.leafPlacements} baseline placements ·{" "}
            {registry.counts.canonicalModules} canonical models ·{" "}
            {registry.counts.categoryNodes} categories · provisional canonical mapping
          </p>
        </div>
        <figure className="hero-figure">
          <HeroCurve />
          <figcaption className="meta">
            Illustrative density shape. The interactive laboratory uses the verified
            computation, not this decorative curve.
          </figcaption>
        </figure>
      </section>

      <section aria-labelledby="branches-heading" style={{ marginTop: "var(--space-12)" }}>
        <h2 id="branches-heading">
          {registry.counts.majorCategories} branches of the probabilistic model space
        </h2>
        <p className="lede">
          Every branch below comes from the frozen baseline registry. Counts are generated from
          placements, not typed into this page.
        </p>
        <div className="grid grid-3" style={{ marginTop: "var(--space-6)" }}>
          {majors.map((category) => (
            <article className="card branch-card" key={category.id}>
              <h3>
                <Link href={categoryUrl(category.id)}>{category.label}</Link>
              </h3>
              <p className="meta">
                {subtreePlacements(category.id)} placements ·{" "}
                {registry.categories.filter((item) => item.parentId === category.id).length}{" "}
                subcategories
              </p>
              <p className="meta">
                Category page: <strong>structure only</strong>; teaching content is planned.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="status-heading" style={{ marginTop: "var(--space-12)" }}>
        <h2 id="status-heading">What is implemented, and what is not</h2>
        <div className="grid grid-2">
          <div className="card">
            <h3>Implemented and locally verified</h3>
            <ul className="status-list">
              <li>
                <StatusBadge status="structure" /> Complete taxonomy registry with exact ordered
                traversal and digest checks.
              </li>
              <li>
                <StatusBadge status="structure" /> Data-driven explorer and category/model routes.
              </li>
              <li>
                <StatusBadge status="implemented" /> Read-only server search at{" "}
                <span className="mono">GET /api/search?q=</span>.
              </li>
              <li>
                <StatusBadge status="partial" /> Gaussian laboratory, lesson and Python export —
                review pending.
              </li>
            </ul>
          </div>
          <div className="card">
            <h3>Planned, not fabricated</h3>
            <ul className="status-list">
              <li>
                <StatusBadge status="planned" /> Lessons for the other{" "}
                {registry.counts.canonicalModules - 1} canonical models.
              </li>
              <li>
                <StatusBadge status="planned" /> Category-level teaching content.
              </li>
              <li>
                <StatusBadge status="planned" /> Foundations library, comparisons, learning paths
                and the relationship graph.
              </li>
              <li>
                <StatusBadge status="planned" /> Additional interactive laboratories.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="notice" style={{ marginTop: "var(--space-8)" }}>
        <strong>Provisional mapping.</strong> Canonical identities and aliases are a candidate
        reconciliation awaiting scientific review. Baseline placements and original labels are
        preserved exactly; nothing has been merged, renamed or removed. No module is accepted.
      </section>

      {gaussian ? (
        <section aria-labelledby="start-heading" style={{ marginTop: "var(--space-8)" }}>
          <h2 id="start-heading">Start with the verified reference slice</h2>
          <p>
            The Gaussian (normal) distribution is the single model implemented in M001. Its
            laboratory keeps one parameter snapshot in sync across the SVG density plot,
            equations, statistics and downloadable Python source.
          </p>
          <div className="row">
            <Link className="button" href="/labs/gaussian-normal">
              Open the Visual Lab
            </Link>
            <Link className="button" href="/models/gaussian-normal">
              Read the Gaussian lesson
            </Link>
            <StatusBadge status={resolveModuleStatus(gaussian.id)} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
