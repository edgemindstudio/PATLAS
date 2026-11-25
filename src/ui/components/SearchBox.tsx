"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { SearchResult, SearchSuccessBody } from "@/server/search/search";
import { StatusBadge } from "./StatusBadge";
import styles from "./SearchBox.module.css";

interface Outcome {
  query: string;
  results: SearchResult[];
  error: boolean;
}

export function SearchBox() {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [retry, setRetry] = useState(0);

  const trimmed = query.trim();
  const isCurrent = outcome !== null && outcome.query === trimmed;
  const results = isCurrent ? outcome.results : [];
  const isError = isCurrent && outcome.error;
  const isLoading = trimmed.length > 0 && !isCurrent;
  const showPanel = open && trimmed.length > 0;

  // Derive the active option so a stale index can never reference an option
  // that no longer exists after results change or the panel closes (RF-009).
  const activeOptionIndex =
    showPanel && activeIndex >= 0 && activeIndex < results.length ? activeIndex : -1;
  const activeOptionId =
    activeOptionIndex >= 0 ? `${listboxId}-option-${activeOptionIndex}` : undefined;

  useEffect(() => {
    if (trimmed.length === 0) return;
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
        headers: { accept: "application/json" },
      })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
          return (await response.json()) as SearchSuccessBody;
        })
        .then((data) => {
          setOutcome({ query: trimmed, results: data.results, error: false });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          console.error("Search request failed", error);
          setOutcome({ query: trimmed, results: [], error: true });
        });
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, retry]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const navigate = (result: SearchResult) => {
    setOpen(false);
    setActiveIndex(-1);
    router.push(result.url);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
      return;
    }
    if (event.key === "Enter") {
      const result = results[activeOptionIndex];
      if (result && showPanel) {
        event.preventDefault();
        navigate(result);
      }
    }
  };

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <label htmlFor="global-search" className="visually-hidden">
        Search models, aliases and categories
      </label>
      <input
        id="global-search"
        className={styles.input}
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-activedescendant={activeOptionId}
        placeholder="Search models, aliases, categories…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(-1);
          setOpen(true);
        }}
        onFocus={() => {
          if (trimmed.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        maxLength={128}
        autoComplete="off"
        spellCheck={false}
        data-testid="search-input"
      />

      <div className="visually-hidden" role="status" aria-live="polite">
        {isLoading
          ? "Searching."
          : isError
            ? "Search is unavailable."
            : statusMessage(isCurrent, results.length, trimmed)}
      </div>

      <div className={styles.panel} hidden={!showPanel} data-testid="search-panel">
        {isLoading ? <p className={styles.message}>Searching…</p> : null}
        {isError ? (
          <>
            <p className={`${styles.message} ${styles.error}`} role="alert">
              Search is temporarily unavailable. Please try again.
            </p>
            <button
              type="button"
              className="button button-small"
              onClick={() => {
                setOutcome(null);
                setRetry((current) => current + 1);
              }}
            >
              Retry search
            </button>
          </>
        ) : null}
        {isCurrent && !isError && results.length === 0 ? (
          <p className={styles.message}>
            No matches for “{trimmed}”. Try a model name, alias or category.
          </p>
        ) : null}

        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          aria-busy={isLoading}
          className={styles.list}
          hidden={results.length === 0}
        >
          {results.map((result, index) => (
            <li
              key={`${result.type}-${result.id}`}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === activeOptionIndex}
              className={styles.option}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => navigate(result)}
            >
              <span className={styles.optionLink}>
                <span className={styles.optionTop}>
                  <span className={styles.optionTitle}>{result.title}</span>
                  <span className={styles.optionBadges}>
                    <span className={styles.type}>
                      {result.type === "model" ? "Model" : "Category"}
                    </span>
                    <StatusBadge status={result.status} />
                  </span>
                </span>
                <span className={styles.branch}>
                  {result.branches
                    .map((branch) => branch.labels.join(" › "))
                    .join("  ·  ")}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <p className={styles.hint}>
          {results.length > 0
            ? `${results.length} of up to 20 results · canonical results deduplicated`
            : "Use ↑ ↓ to move, Enter to open, Esc to close."}
        </p>
      </div>
    </div>
  );
}

function statusMessage(isCurrent: boolean, count: number, query: string): string {
  if (!isCurrent) return "";
  if (count === 0) return `No matches for ${query}.`;
  return `${count} results.`;
}
