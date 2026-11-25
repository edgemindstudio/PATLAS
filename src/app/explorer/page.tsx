import { loadRegistry } from "@/server/registry";
import { buildTreeDto } from "@/server/registry/build";
import { resolveModuleStatus } from "@/server/content/lessons";
import { TreeNav } from "@/ui/components/TreeNav";

export const metadata = {
  title: "Explorer",
  description:
    "Expand the complete PATLAS taxonomy of probabilistic models and open any canonical model page.",
};

export default async function ExplorerPage() {
  const registry = await loadRegistry();
  const tree = buildTreeDto(registry, resolveModuleStatus);

  return (
    <div className="page">
      <header className="page-header">
        <p className="kicker">Data-driven navigation</p>
        <h1>Model explorer</h1>
        <p className="lede">
          The full frozen taxonomy: {tree.counts.majorCategories} branches,{" "}
          {tree.counts.categoryNodes} category nodes, {tree.counts.leafPlacements} original
          placements and {tree.counts.canonicalModules} provisional canonical models. Expand a
          branch or filter by name, alias or original label.
        </p>
        <p className="meta">
          The relationship graph is <strong>planned</strong> and not implemented in M001. The
          expandable tree is the accessible primary navigation.
        </p>
      </header>

      <div className="card">
        <TreeNav tree={tree} variant="explorer" searchable />
      </div>

      <div className="notice" style={{ marginTop: "var(--space-6)" }}>
        {tree.provisionalNotice}
      </div>

      <section style={{ marginTop: "var(--space-8)" }} aria-labelledby="explorer-notes">
        <h2 id="explorer-notes">Reading status badges</h2>
        <ul className="prose">
          <li>
            <strong>Partial</strong> — an implemented reference slice awaiting independent review.
          </li>
          <li>
            <strong>Planned</strong> — the route is real and the placement is preserved, but no
            lesson has been written.
          </li>
          <li>
            <strong>Structure only</strong> — category routes exist; category teaching content is
            planned.
          </li>
        </ul>
      </section>
    </div>
  );
}
