import type { TreeNodeDto, TreeNodeEntry, TreeDto } from "@/server/registry/build";

/**
 * Client-side tree filtering. Navigation data still comes from the registry
 * DTO; filtering only hides non-matching branches and preserves the relative
 * order of retained sibling entries.
 */
export function filterTree(tree: TreeDto, rawQuery: string): TreeDto {
  const query = rawQuery.trim().normalize("NFKC").toLowerCase();
  if (!query) return tree;

  const filterNode = (node: TreeNodeDto): TreeNodeDto | null => {
    const selfMatches = node.label.toLowerCase().includes(query);
    if (selfMatches) return node;

    const entries = node.entries
      .map((entry): TreeNodeEntry | null => {
        if (entry.type === "category") {
          const child = filterNode(entry.node);
          return child ? { type: "category", node: child } : null;
        }
        const matches =
          entry.module.label.toLowerCase().includes(query) ||
          entry.module.title.toLowerCase().includes(query);
        return matches ? entry : null;
      })
      .filter((entry): entry is TreeNodeEntry => entry !== null);

    if (entries.length === 0) return null;
    return {
      ...node,
      entries,
      children: entries.flatMap((entry) => (entry.type === "category" ? [entry.node] : [])),
      modules: entries.flatMap((entry) => (entry.type === "module" ? [entry.module] : [])),
    };
  };

  return {
    ...tree,
    children: tree.children
      .map((child) => filterNode(child))
      .filter((child): child is TreeNodeDto => child !== null),
  };
}

export function categoryIds(tree: TreeDto): string[] {
  const ids: string[] = [];
  const walk = (node: TreeNodeDto) => {
    ids.push(node.id);
    node.children.forEach(walk);
  };
  tree.children.forEach(walk);
  return ids;
}
