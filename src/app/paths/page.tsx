import Link from "next/link";

export const metadata = {
  title: "Learning Paths",
};

const PATHS = [
  {
    title: "Beginner probability",
    description:
      "Start from random variables and distributions, then build intuition for density and expectation.",
  },
  {
    title: "Statistical modelling",
    description:
      "Move from distributions to estimation, uncertainty and regression-style models.",
  },
  {
    title: "Generative modelling",
    description:
      "Follow latent-variable and deep generative families from mixtures to flows and diffusion.",
  },
  {
    title: "Research track",
    description:
      "Read the taxonomy as a map of families, representations, inference methods and architectures.",
  },
];

export default function PathsPage() {
  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Learning Paths · planned</p>
        <h1>Structured routes through the atlas</h1>
        <p className="lede">
          Four approved learning paths are planned. They will sequence existing lessons; they are
          not alternative taxonomies and will not replace baseline placements.
        </p>
        <span className="badge badge-planned">Planned</span>
      </header>

      <div className="notice notice-warning">
        <strong>Not implemented in M001.</strong> No path currently contains lessons beyond the
        single Gaussian reference slice.
      </div>

      <div className="grid grid-2" style={{ marginTop: "var(--space-6)" }}>
        {PATHS.map((path) => (
          <article className="card" key={path.title}>
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>{path.title}</h2>
            <p className="meta">{path.description}</p>
            <span className="badge badge-planned">Planned</span>
          </article>
        ))}
      </div>

      <div className="row" style={{ marginTop: "var(--space-8)" }}>
        <Link className="button" href="/models/gaussian-normal">
          Start with the available lesson
        </Link>
      </div>
    </div>
  );
}
