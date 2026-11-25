import Link from "next/link";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="page">
      <p className="kicker">404</p>
      <h1>That identifier is not in the atlas</h1>
      <p className="lede">
        The requested category, model or page does not exist in the frozen PATLAS registry.
        Nothing has been substituted, and no placeholder lesson has been invented.
      </p>

      <div className="card" style={{ marginTop: "var(--space-6)" }}>
        <h2 style={{ marginTop: 0 }}>Recover from here</h2>
        <ul>
          <li>
            <Link href="/explorer">Open the model explorer</Link> to browse all branches and
            placements.
          </li>
          <li>
            <Link href="/">Return home</Link> and start from the nine major branches.
          </li>
          <li>
            Use the search box in the header to find a canonical title, alias or category.
          </li>
        </ul>
      </div>
    </div>
  );
}
