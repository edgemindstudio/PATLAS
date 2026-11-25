"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const THEME_EVENT = "patlas-theme-change";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Theme {
  const current = document.documentElement.dataset.theme;
  return current === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("patlas-theme", next);
    } catch {
      // Storage may be unavailable in private or restricted contexts.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <button
      type="button"
      className="button button-small"
      onClick={toggle}
      aria-pressed={theme === "dark"}
      aria-label={`${theme === "dark" ? "Dark" : "Light"} theme. Switch to ${theme === "dark" ? "light" : "dark"} theme.`}
      data-testid="theme-toggle"
      title={`Current theme: ${theme}`}
    >
      <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
      <span>{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
