import { readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

export interface ProjectionModule {
  id: string;
  name: string;
  aliases: string[];
  status: string;
}

export interface ProjectionCategory {
  id: string;
  label: string;
  parent: string;
  order: number;
}

const projection = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "registry", "baseline", "TAXONOMY_PROJECTION_CANDIDATE.json"),
    "utf8",
  ),
) as { modules: ProjectionModule[]; categories: ProjectionCategory[] };

export const MODULES = projection.modules;
export const CATEGORIES = projection.categories;

export const EVIDENCE_DIR = path.join(process.cwd(), "evidence");

export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

export const SCREENSHOT_VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 375, height: 812 },
} as const;
