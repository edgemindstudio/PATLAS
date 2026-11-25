import Link from "next/link";
import { notFound } from "next/navigation";
import { loadRegistry } from "@/server/registry";
import { findModule, moduleUrl } from "@/server/registry/build";
import { resolveModuleStatus } from "@/server/content/lessons";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { StatusBadge } from "@/ui/components/StatusBadge";
import { GaussianLab } from "@/features/lab/GaussianLab";

export function generateStaticParams() {
  return [{ id: "gaussian-normal" }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: id === "gaussian-normal" ? "Gaussian laboratory" : "Laboratory not found" };
}

export default async function LabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const registry = await loadRegistry();
  const record = findModule(registry, id);
  if (!record || id !== "gaussian-normal") notFound();

  return (
    <div className="page">
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/labs", label: "Visual Lab" },
          { label: "Gaussian density" },
        ]}
      />

      <header className="page-header">
        <p className="kicker">Interactive experiment</p>
        <h1>Gaussian density laboratory</h1>
        <p className="lede">
          A single verified computation drives every output in this workspace. The model
          remains partial pending independent review.
        </p>
        <div className="row">
          <StatusBadge status={resolveModuleStatus(record.id)} />
          <Link href={moduleUrl(record.id)}>Full lesson and references</Link>
        </div>
      </header>

      <GaussianLab />

      <p className="meta">
        The display window is finite by design. The Gaussian has unbounded support; the plot does
        not claim otherwise, and the visible area is not used as proof of normalization.
      </p>
    </div>
  );
}
