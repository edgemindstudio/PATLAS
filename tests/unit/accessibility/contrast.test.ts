import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const TOKENS = readFileSync(path.join(process.cwd(), "src", "ui", "tokens.css"), "utf8");
const EVIDENCE_DIR = path.join(process.cwd(), "evidence", "correction");

function block(selector: string): string {
  const start = TOKENS.indexOf(selector);
  if (start === -1) throw new Error(`Missing token block ${selector}`);
  const open = TOKENS.indexOf("{", start);
  const close = TOKENS.indexOf("}", open);
  return TOKENS.slice(open + 1, close);
}

function token(blockSource: string, name: string): string {
  const match = blockSource.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Missing token --${name}`);
  return match[1]!;
}

function luminance(hex: string): number {
  const channels = hex
    .replace("#", "")
    .match(/../g)!
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const light = block(":root");
const dark = block('[data-theme="dark"]');

const TEXT_PAIRS = [
  ["text", "canvas"],
  ["text", "surface"],
  ["muted", "canvas"],
  ["muted", "surface"],
  ["primary", "surface"],
  ["link", "surface"],
] as const;

const NON_TEXT_PAIRS = [
  ["border-strong", "surface"],
  ["focus", "canvas"],
  ["chart-1", "surface"],
] as const;

const STATUS_PAIRS = [
  ["status-partial-fg", "status-partial-bg"],
  ["status-planned-fg", "status-planned-bg"],
  ["status-implemented-fg", "status-implemented-bg"],
  ["danger", "danger-bg"],
] as const;

function measure(source: string, pairs: ReadonlyArray<readonly [string, string]>) {
  return pairs.map(([foreground, background]) => ({
    pair: `${foreground}/${background}`,
    foreground: token(source, foreground),
    background: token(source, background),
    ratio: contrast(token(source, foreground), token(source, background)),
  }));
}

describe("theme contrast (RF-004)", () => {
  const evidence = {
    generatedBy: "tests/unit/accessibility/contrast.test.ts",
    measuredAt: new Date().toISOString(),
    method: "WCAG relative luminance ratio from src/ui/tokens.css",
    thresholds: { text: 4.5, nonText: 3.0 },
    light: {
      text: measure(light, TEXT_PAIRS),
      nonText: measure(light, NON_TEXT_PAIRS),
      status: measure(light, STATUS_PAIRS),
    },
    dark: {
      text: measure(dark, TEXT_PAIRS),
      nonText: measure(dark, NON_TEXT_PAIRS),
      status: measure(dark, STATUS_PAIRS),
    },
  };

  it("meets 4.5:1 for text and 3:1 for relevant non-text in both themes", () => {
    for (const theme of [evidence.light, evidence.dark]) {
      for (const pair of [...theme.text, ...theme.status]) {
        expect(pair.ratio, `${pair.pair} text contrast`).toBeGreaterThanOrEqual(4.5);
      }
      for (const pair of theme.nonText) {
        expect(pair.ratio, `${pair.pair} non-text contrast`).toBeGreaterThanOrEqual(3.0);
      }
    }
  });

  it("records the measured ratios as correction evidence", () => {
    mkdirSync(EVIDENCE_DIR, { recursive: true });
    writeFileSync(
      path.join(EVIDENCE_DIR, "contrast.json"),
      `${JSON.stringify(evidence, null, 2)}\n`,
      "utf8",
    );
  });
});
