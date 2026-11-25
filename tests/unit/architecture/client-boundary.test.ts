import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

function isClientComponent(source: string): boolean {
  return /^\s*["']use client["'];?/m.test(source.split("\n").slice(0, 3).join("\n"));
}

const APP_AND_UI_FILES = [
  ...walk(path.join(ROOT, "src", "app")),
  ...walk(path.join(ROOT, "src", "features")),
  ...walk(path.join(ROOT, "src", "ui")),
];

const SERVER_FILES = [
  ...walk(path.join(ROOT, "src", "server")),
  path.join(ROOT, "src", "science", "gaussian.ts"),
];

describe("server/client boundary", () => {
  it("does not import server-only or Node built-ins from client components", () => {
    const violations: string[] = [];
    const forbidden =
      /^\s*import\s+(?!type\b)[^;]*from\s+["'](?:@\/server\/registry(?:\/index)?|@\/server\/content\/markdown|node:)[^"']*["']/gm;

    for (const file of APP_AND_UI_FILES) {
      const source = readFileSync(file, "utf8");
      if (!isClientComponent(source)) continue;
      for (const match of source.matchAll(forbidden)) {
        violations.push(`${path.relative(ROOT, file)}: ${match[0].trim()}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("keeps registry, search and science modules free of React and Next.js imports", () => {
    const violations: string[] = [];
    const forbidden = /from\s+["'](?:react|react-dom|next(?:\/[^"']*)?)["']/;
    for (const file of SERVER_FILES) {
      const source = readFileSync(file, "utf8");
      if (forbidden.test(source)) violations.push(path.relative(ROOT, file));
    }
    expect(violations).toEqual([]);
  });
});
