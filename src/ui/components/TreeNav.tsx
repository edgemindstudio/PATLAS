"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import type { TreeDto, TreeModuleDto, TreeNodeDto } from "@/server/registry/build";
import { StatusBadge } from "./StatusBadge";
import { categoryIds, filterTree } from "../tree-filter";
import styles from "./TreeNav.module.css";

interface TreeNavProps {
  tree: TreeDto;
  variant?: "sidebar" | "drawer" | "explorer";
  searchable?: boolean;
}

export function TreeNav({ tree, variant = "sidebar", searchable = false }: TreeNavProps) {
  const baseId = useId();
  const navRef = useRef<HTMLElement>(null);
  const [manualExpanded, setManualExpanded] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState("");

  const visibleTree = useMemo(() => filterTree(tree, filter), [tree, filter]);
  const isFiltering = filter.trim().length > 0;

  // While filtering, matching branches are revealed without touching the user's
  // manual expansion state.
  const expanded = useMemo(
    () => (isFiltering ? new Set(categoryIds(visibleTree)) : manualExpanded),
    [isFiltering, visibleTree, manualExpanded],
  );

  const toggle = (id: string) => {
    setManualExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setManualExpanded(new Set(categoryIds(visibleTree)));
  const collapseAll = () => setManualExpanded(new Set());

  /**
   * Keyboard handling is scoped to the <nav> tree itself (RF-008). Keys typed
   * in the filter input keep their ordinary text-editing behaviour.
   */
  const onTreeKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable='true']")) return;

    const active = document.activeElement as HTMLElement | null;
    if (!active || active.getAttribute("data-tree-focusable") !== "true") return;

    const nav = navRef.current;
    if (!nav) return;
    const focusable = Array.from(
      nav.querySelectorAll<HTMLElement>("[data-tree-focusable='true']"),
    ).filter((element) => element.offsetParent !== null);
    const index = focusable.indexOf(active);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusable[Math.min(focusable.length - 1, index + 1)]?.focus();
        break;
      case "ArrowUp":
        event.preventDefault();
        focusable[Math.max(0, index - 1)]?.focus();
        break;
      case "Home":
        event.preventDefault();
        focusable[0]?.focus();
        break;
      case "End":
        event.preventDefault();
        focusable[focusable.length - 1]?.focus();
        break;
      case "ArrowRight": {
        if (active.tagName !== "BUTTON") return;
        const id = active.getAttribute("data-category-id");
        if (id && !expanded.has(id)) {
          event.preventDefault();
          setManualExpanded((current) => new Set(current).add(id));
        }
        break;
      }
      case "ArrowLeft": {
        if (active.tagName !== "BUTTON") return;
        const id = active.getAttribute("data-category-id");
        if (id && expanded.has(id)) {
          event.preventDefault();
          setManualExpanded((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
        }
        break;
      }
      default:
        break;
    }
  };

  const renderModule = (record: TreeModuleDto) => (
    <li key={`${record.id}-${record.label}`} className={styles.moduleItem}>
      <Link href={record.url} className={styles.moduleLink} data-tree-focusable="true">
        <span>{record.label}</span>
        {record.status !== "planned" ? <StatusBadge status={record.status} /> : null}
      </Link>
    </li>
  );

  const renderNode = (node: TreeNodeDto) => {
    const isOpen = expanded.has(node.id);
    const groupId = `${baseId}-group-${node.id}`;
    return (
      <li key={node.id} className={styles.item}>
        <div className={styles.row}>
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={isOpen}
            aria-controls={groupId}
            data-tree-focusable="true"
            data-category-id={node.id}
            onClick={() => toggle(node.id)}
          >
            <span aria-hidden="true" className={styles.chevron}>
              {isOpen ? "▾" : "▸"}
            </span>
            <span className="visually-hidden">
              {isOpen ? "Collapse" : "Expand"} {node.label}
            </span>
          </button>
          <Link
            href={node.url}
            className={styles.categoryLink}
            data-tree-focusable="true"
            title={`${node.moduleCount} placement${node.moduleCount === 1 ? "" : "s"}`}
          >
            {node.label}
          </Link>
          <span className={styles.count} aria-hidden="true">
            {node.moduleCount}
          </span>
        </div>
        <ul id={groupId} className={styles.group} hidden={!isOpen}>
          {node.entries.map((entry) =>
            entry.type === "category" ? renderNode(entry.node) : renderModule(entry.module),
          )}
        </ul>
      </li>
    );
  };

  return (
    <div className={`${styles.nav} ${styles[variant]}`}>
      {searchable ? (
        <div className={styles.controls}>
          <label className={styles.filterLabel} htmlFor={`${baseId}-filter`}>
            Filter models
          </label>
          <input
            id={`${baseId}-filter`}
            className={styles.filterInput}
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="e.g. Gaussian, HMM, diffusion"
            maxLength={128}
            autoComplete="off"
          />
          <div className={styles.bulk}>
            <button type="button" className="button button-small" onClick={expandAll}>
              Expand all
            </button>
            <button type="button" className="button button-small" onClick={collapseAll}>
              Collapse all
            </button>
          </div>
        </div>
      ) : null}

      <nav aria-label="Model taxonomy" ref={navRef} onKeyDown={onTreeKeyDown}>
        <ul className={styles.root}>{visibleTree.children.map(renderNode)}</ul>
      </nav>

      {visibleTree.children.length === 0 ? (
        <p className={styles.empty}>No models match “{filter.trim()}”.</p>
      ) : null}

      <p className={styles.counts}>
        {tree.counts.majorCategories} branches · {tree.counts.categoryNodes} categories ·{" "}
        {tree.counts.leafPlacements} placements · {tree.counts.canonicalModules} canonical
        models
      </p>
    </div>
  );
}
