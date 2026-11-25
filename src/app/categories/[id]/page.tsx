import Link from "next/link";
import { notFound } from "next/navigation";
import { loadRegistry } from "@/server/registry";
import { categoryUrl, findCategory, moduleUrl } from "@/server/registry/build";
import { resolveModuleStatus } from "@/server/content/lessons";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { StatusBadge } from "@/ui/components/StatusBadge";

export async function generateStaticParams() {
  const registry = await loadRegistry();
  return registry.categories.map((category) => ({ id: category.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const registry = await loadRegistry();
  const category = findCategory(registry, id);
  return { title: category ? category.label : "Category not found" };
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const registry = await loadRegistry();
  const category = findCategory(registry, id);
  if (!category) notFound();

  const children = category.childCategoryIds
    .map((childId) => findCategory(registry, childId))
    .filter((child): child is NonNullable<typeof child> => Boolean(child))
    .sort((a, b) => a.order - b.order);
  const placements = registry.placements
    .filter((placement) => placement.categoryId === category.id)
    .sort((a, b) => a.order - b.order);
  const moduleById = new Map(registry.modules.map((record) => [record.id, record]));

  const crumbs = [
    { href: "/", label: "Home" },
    { href: "/explorer", label: "Explorer" },
    ...category.path.slice(0, -1).map((item) => ({
      href: categoryUrl(item.id),
      label: item.label,
    })),
    { label: category.label },
  ];

  return (
    <div className="page">
      <Breadcrumbs items={crumbs} />

      <header className="page-header">
        <p className="kicker">
          {category.isMajor ? "Major branch" : "Category"} · structure only
        </p>
        <h1>{category.label}</h1>
        <p className="lede">
          This category route is generated from the frozen registry. The shared principles and
          category-level lesson are planned; the placements below are real baseline entries.
        </p>
        <div className="row" style={{ marginTop: "var(--space-3)" }}>
          <StatusBadge status="structure" />
          <span className="meta">
            {placements.length} direct placement{placements.length === 1 ? "" : "s"} ·{" "}
            {children.length} subcategor{children.length === 1 ? "y" : "ies"}
          </span>
        </div>
      </header>

      <div className="notice notice-warning">
        <strong>Category teaching content is planned.</strong> M001 implements the structural
        route so every baseline category resolves. No category lesson has been written and
        nothing here counts as complete teaching material.
      </div>

      {children.length > 0 ? (
        <section aria-labelledby="subcategories" style={{ marginTop: "var(--space-8)" }}>
          <h2 id="subcategories">Subcategories</h2>
          <div className="grid grid-2">
            {children.map((child) => (
              <article className="card" key={child.id}>
                <h3>
                  <Link href={categoryUrl(child.id)}>{child.label}</Link>
                </h3>
                <p className="meta">
                  {child.placementIds.length} placement
                  {child.placementIds.length === 1 ? "" : "s"}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="placements" style={{ marginTop: "var(--space-8)" }}>
        <h2 id="placements">Baseline placements</h2>
        {placements.length === 0 ? (
          <p className="meta">
            This category contains subcategories only. Follow a subcategory to see its
            placements.
          </p>
        ) : (
          <table className="data">
            <caption className="visually-hidden">
              Baseline placements in {category.label}, in their original order
            </caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Original label</th>
                <th scope="col">Canonical model</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {placements.map((placement, index) => {
                const record = moduleById.get(placement.moduleId);
                if (!record) return null;
                return (
                  <tr key={placement.id}>
                    <td>{index + 1}</td>
                    <td>{placement.label}</td>
                    <td>
                      <Link href={moduleUrl(record.id)}>{record.title}</Link>
                      {record.title !== placement.label ? (
                        <span className="meta"> (shared canonical page)</span>
                      ) : null}
                    </td>
                    <td>
                      <StatusBadge status={resolveModuleStatus(record.id)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="explore-more" style={{ marginTop: "var(--space-8)" }}>
        <h2 id="explore-more">Explore this branch</h2>
        <p>
          The explorer expands this branch with every original label, canonical destination and
          status.
        </p>
        <Link className="button" href="/explorer">
          Open the model explorer
        </Link>
      </section>
    </div>
  );
}
