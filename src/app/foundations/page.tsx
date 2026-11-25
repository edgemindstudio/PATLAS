import Link from "next/link";

export const metadata = {
  title: "Foundations",
};

export default function FoundationsPage() {
  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Foundations · planned</p>
        <h1>Prerequisite concepts</h1>
        <p className="lede">
          The Foundations library will teach the concepts needed to read model lessons: random
          variables, distributions, expectation and variance, likelihood, conditional
          probability and Bayes&apos; theorem.
        </p>
        <span className="badge badge-planned">Planned</span>
      </header>

      <div className="notice notice-warning">
        <strong>Not implemented in M001.</strong> No foundation lesson, exercise or route is
        published here. The navigation destination exists so the shell is honest about the
        approved product structure rather than linking nowhere.
      </div>

      <section style={{ marginTop: "var(--space-8)" }} aria-labelledby="current-support">
        <h2 id="current-support">What exists today</h2>
        <p>
          The Gaussian reference lesson explains its own assumptions and notation, including the
          difference between density and probability, so it can be read without the Foundations
          library.
        </p>
        <div className="row">
          <Link className="button" href="/models/gaussian-normal">
            Open the Gaussian lesson
          </Link>
          <Link className="button" href="/explorer">
            Browse models
          </Link>
        </div>
      </section>
    </div>
  );
}
