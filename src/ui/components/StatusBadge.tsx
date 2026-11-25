import type { ModuleLifecycleStatus } from "@/server/registry/types";

export type DisplayStatus = ModuleLifecycleStatus | "structure";

const LABELS: Record<DisplayStatus, string> = {
  planned: "Planned",
  partial: "Partial",
  implemented: "Implemented",
  verified: "Verified",
  structure: "Structure only",
};

const CLASSES: Record<DisplayStatus, string> = {
  planned: "badge badge-planned",
  partial: "badge badge-partial",
  implemented: "badge badge-implemented",
  verified: "badge badge-implemented",
  structure: "badge badge-structure",
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <span className={CLASSES[status]} title={statusTitle(status)}>
      {LABELS[status]}
    </span>
  );
}

export function statusLabel(status: DisplayStatus): string {
  return LABELS[status];
}

function statusTitle(status: DisplayStatus): string {
  switch (status) {
    case "planned":
      return "Planned: this entry is navigable but its lesson has not been written.";
    case "partial":
      return "Partial: an implemented reference slice that has not passed independent review or acceptance.";
    case "implemented":
      return "Implemented: locally verified, review pending.";
    case "verified":
      return "Verified: evidence reviewed.";
    case "structure":
      return "Structure only: the route and taxonomy exist; teaching content is planned.";
  }
}
