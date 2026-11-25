import type { TreeNodeDto, TreeDto } from "@/server/registry/build";

/**
 * Client-side tree filtering. Navigation data still comes from the registry
 * DTO; filtering only hides non-matching branches.
 */
export function filterTree(tree: TreeDto, rawQuery: string): TreeDto {
  const query = rawQuery.trim().normalize("NFKC").toLowerCase();
  if (!query) return tree;

  const filterNode = (node: TreeNodeDto): TreeNodeDto | null => {
    const selfMatches = node.label.toLowerCase().includes(query);
    if (selfMatches) return node;

    const children = node.children
      .map((child) => filterNode(child))
      .filter((child): child is TreeNodeDto => child !== null);
    const modules = node.modules.filter(
      (record) =>
        record.label.toLowerCase().includes(query) ||
        record.title.toLowerCase().includes(query),
    );

    if (children.length === 0 && modules.length === 0) return null;
    return { ...node, children, modules };
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
