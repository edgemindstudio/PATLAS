import Link from "next/link";

export const metadata = {
  title: "Compare",
};

export default function ComparePage() {
  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Compare · planned</p>
        <h1>Compare models under shared conditions</h1>
        <p className="lede">
          Comparison will show selected entries side by side with shared quantities, assumptions
          and caveats — without equating incompatible densities or presenting illustrative plots
          as fitted results.
        </p>
        <span className="badge badge-planned">Planned</span>
      </header>

      <div className="notice notice-warning">
        <strong>Not implemented in M001.</strong> This is an honest placeholder. Only one model
        (the Gaussian) has an implemented reference slice, so a comparison tool would have
        nothing verified to compare.
      </div>

      <section style={{ marginTop: "var(--space-8)" }} aria-labelledby="compare-principles">
        <h2 id="compare-principles">Approved comparison principles</h2>
        <ul className="prose">
          <li>Use shared data and evaluation conditions where a comparison is quantitative.</li>
          <li>Distinguish model definition, fitting, inference and sampling.</li>
          <li>Do not compare density heights across models as if they were probabilities.</li>
          <li>State limitations and uncertainty explicitly.</li>
        </ul>
        <Link className="button" href="/explorer">
          Explore implementable entries
        </Link>
      </section>
    </div>
  );
}
