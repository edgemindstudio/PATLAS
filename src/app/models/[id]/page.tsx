import Link from "next/link";
import { notFound } from "next/navigation";
import { loadRegistry } from "@/server/registry";
import { categoryUrl, findModule, moduleUrl } from "@/server/registry/build";
import { resolveModuleStatus, getGaussianLesson } from "@/server/content/lessons";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { StatusBadge } from "@/ui/components/StatusBadge";
import { GaussianLesson } from "@/features/lesson/GaussianLesson";

export async function generateStaticParams() {
  const registry = await loadRegistry();
  return registry.modules.map((record) => ({ id: record.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const registry = await loadRegistry();
  const record = findModule(registry, id);
  return {
    title: record ? record.title : "Model not found",
    description: record
      ? `${record.title} in the PATLAS probabilistic model atlas.`
      : undefined,
  };
}

export default async function ModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const registry = await loadRegistry();
  const record = findModule(registry, id);
  if (!record) notFound();

  const primaryPath = record.categoryPaths[0] ?? [];
  const crumbs = [
    { href: "/", label: "Home" },
    { href: "/explorer", label: "Explorer" },
    ...primaryPath.map((item) => ({ href: categoryUrl(item.id), label: item.label })),
    { label: record.title },
  ];

  if (record.id === "gaussian-normal") {
    const related = getGaussianLesson()
      .relatedModels.map((relatedId) => findModule(registry, relatedId))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
    return <GaussianLesson model={record} crumbs={crumbs} related={related} />;
  }

  return (
    <div className="page">
      <Breadcrumbs items={crumbs} />

      <header className="page-header">
        <p className="kicker">Canonical model entry · provisional identity</p>
        <h1>{record.title}</h1>
        <div className="row">
          <StatusBadge status={resolveModuleStatus(record.id)} />
          <span className="meta">
            {record.placements.length} baseline placement
            {record.placements.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <div className="notice notice-warning">
        <strong>Planned — no lesson has been written.</strong> This route exists because the
        frozen baseline places “{record.placements[0]?.label ?? record.title}” in the taxonomy.
        M001 does not fabricate content for unimplemented models.
      </div>

      <section aria-labelledby="placement-context" style={{ marginTop: "var(--space-8)" }}>
        <h2 id="placement-context">Placement and branch context</h2>
        {record.placements.length > 1 ? (
          <p>
            This canonical model has {record.placements.length} duplicate baseline placements.
            Each placement keeps its original label and branch, and all of them resolve to this
            single canonical URL. The reconciliation remains provisional.
          </p>
        ) : (
          <p>
            The model appears once in the frozen baseline. Its original label and branch are
            preserved below.
          </p>
        )}
        <ul className="placement-list">
          {record.placements.map((placement) => (
            <li key={placement.id}>
              <Link href={categoryUrl(placement.categoryId)}>
                {placement.categoryPath.map((item) => item.label).join(" › ")}
              </Link>
              <span className="meta"> — original label: “{placement.label}”</span>
            </li>
          ))}
        </ul>
        {record.aliases.length > 0 ? (
          <p className="meta">Aliases retained from the projection: {record.aliases.join(", ")}.</p>
        ) : null}
      </section>

      <section aria-labelledby="route-guarantee" style={{ marginTop: "var(--space-8)" }}>
        <h2 id="route-guarantee">What this page guarantees</h2>
        <ul className="prose">
          <li>The identifier is a real canonical entry in the frozen registry.</li>
          <li>Every duplicate placement resolves to this same URL.</li>
          <li>Planned status is explicit; no sample equations or invented results appear.</li>
          <li>
            When the lesson is authored and reviewed, it will populate this route rather than
            create a parallel one.
          </li>
        </ul>
      </section>

      <div className="row" style={{ marginTop: "var(--space-8)" }}>
        <Link className="button" href="/explorer">
          Browse the full taxonomy
        </Link>
        <Link className="button" href={moduleUrl("gaussian-normal")}>
          See the implemented Gaussian slice
        </Link>
      </div>
    </div>
  );
}
