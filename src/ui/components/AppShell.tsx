"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { TreeDto } from "@/server/registry/build";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";
import { TreeNav } from "./TreeNav";
import styles from "./AppShell.module.css";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/explorer", label: "Explorer" },
  { href: "/foundations", label: "Foundations" },
  { href: "/labs", label: "Visual Lab" },
  { href: "/compare", label: "Compare" },
  { href: "/paths", label: "Learning Paths" },
  { href: "/code", label: "Code" },
];

function BrandMark() {
  return (
    <svg
      className={styles.mark}
      viewBox="0 0 32 32"
      width="30"
      height="30"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 27h26" className={styles.markAxis} strokeWidth="1.5" />
      <path d="M5 27v-22" className={styles.markAxis} strokeWidth="1.5" />
      <path
        d="M5 26c3.2 0 4.6-1.4 6-6.2C13 12.4 14.4 6 18 6c3.4 0 4.6 5.4 6.4 11.2C25.8 22 27.2 25 29 25"
        fill="none"
        className={styles.markCurve}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppShell({ tree, children }: { tree: TreeDto; children: ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPath, setDrawerPath] = useState(pathname);
  const browseButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // The drawer closes automatically when navigation changes the pathname,
  // without an effect-driven state reset.
  const drawerVisible = drawerOpen && drawerPath === pathname;

  const openDrawer = () => {
    setDrawerPath(pathname);
    setDrawerOpen(true);
  };

  useEffect(() => {
    if (!drawerVisible) return;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        window.setTimeout(() => browseButtonRef.current?.focus(), 0);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input, [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerVisible]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    window.setTimeout(() => browseButtonRef.current?.focus(), 0);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div className={styles.background} inert={drawerVisible || undefined}>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>

        <header className={styles.header}>
          <div className={styles.headerInner}>
            <button
              ref={browseButtonRef}
              type="button"
              className={`${styles.browseButton} button button-small`}
              aria-expanded={drawerVisible}
              aria-controls="mobile-drawer"
              onClick={openDrawer}
            >
              <span aria-hidden="true">☰</span>
              <span>Browse</span>
            </button>

            <Link href="/" className={styles.brand}>
              <BrandMark />
              <span className={styles.brandText}>
                <span className={styles.brandName}>PATLAS</span>
                <span className={styles.brandTag}>Probabilistic Atlas</span>
              </span>
            </Link>

            <nav className={styles.primaryNav} aria-label="Primary">
              <ul className={styles.navList}>
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={styles.navLink}
                      aria-current={isActive(item.href) ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className={styles.actions}>
              <div className={styles.searchWrap}>
                <SearchBox />
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className={styles.frame}>
          <aside className={styles.sidebar} aria-label="Explorer sidebar">
            <div className={styles.sidebarSticky}>
              <p className={styles.sidebarTitle}>Model explorer</p>
              <TreeNav tree={tree} variant="sidebar" />
              <p className={styles.provisional}>{tree.provisionalNotice}</p>
            </div>
          </aside>
          <main id="main-content" className={styles.main} tabIndex={-1}>
            {children}
          </main>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div>
              <p className={styles.footerBrand}>PATLAS — Probabilistic Atlas</p>
              <p className={styles.footerText}>
                Visual-first learning about probabilistic models, with reproducible mathematics
                and runnable reference code.
              </p>
            </div>
            <div>
              <p className={styles.footerHeading}>Licensing</p>
              <p className={styles.footerText}>
                Original software: MIT. Original educational content: CC BY 4.0. Third-party
                references are cited, not reproduced.
              </p>
            </div>
            <div>
              <p className={styles.footerHeading}>Milestone</p>
              <p className={styles.footerText}>
                PATLAS-M001 reference slice. Independent engineering and scientific review
                pending; no module is accepted.
              </p>
              <p className={styles.footerLinks}>
                <a href="https://github.com/edgemindstudio/PATLAS">Repository</a>
                <span aria-hidden="true"> · </span>
                <Link href="/explorer">Explorer</Link>
              </p>
            </div>
          </div>
        </footer>
      </div>

      {drawerVisible ? (
        <div
          className={styles.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDrawer();
          }}
        >
          <div
            id="mobile-drawer"
            ref={dialogRef}
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Model browser and navigation"
          >
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Browse PATLAS</span>
              <button
                ref={closeButtonRef}
                type="button"
                className="button button-small"
                onClick={closeDrawer}
                aria-label="Close navigation drawer"
              >
                ✕ Close
              </button>
            </div>
            <nav aria-label="Destinations">
              <ul className={styles.drawerNav}>
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={styles.drawerLink}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      onClick={closeDrawer}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <hr />
            <TreeNav tree={tree} variant="drawer" />
          </div>
        </div>
      ) : null}
    </>
  );
}
