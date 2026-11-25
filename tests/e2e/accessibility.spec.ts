import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  { name: "home", path: "/" },
  { name: "explorer", path: "/explorer" },
  { name: "gaussian lesson", path: "/models/gaussian-normal" },
  { name: "gaussian laboratory", path: "/labs/gaussian-normal" },
];

for (const theme of ["light", "dark"] as const) {
  test.describe(`automated accessibility scan (${theme})`, () => {
    for (const target of PAGES) {
      test(`${target.name} has no detected WCAG A/AA violations`, async ({ page }) => {
        await page.addInitScript((value) => {
          window.localStorage.setItem("patlas-theme", value);
        }, theme);
        await page.goto(target.path);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();

        const summary = results.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          nodes: violation.nodes.map((node) => node.target),
        }));
        expect(summary).toEqual([]);
      });
    }
  });
}

test("focus is visible and reduced-motion preferences are respected", async ({ page }) => {
  await page.goto("/models/gaussian-normal");
  const search = page.getByTestId("search-input");
  await search.focus();
  const outlineWidth = await search.evaluate(
    (element) => getComputedStyle(element).outlineWidth,
  );
  expect(outlineWidth).not.toBe("0px");

  await page.emulateMedia({ reducedMotion: "reduce" });
  const scrollBehavior = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  expect(scrollBehavior).toBe("auto");

  const animationDuration = await page.evaluate(() => {
    const element = document.querySelector("main");
    return element ? getComputedStyle(element).animationDuration : "none";
  });
  expect(animationDuration === "none" || Number.parseFloat(animationDuration) <= 0.001).toBe(true);
});

test("heading order and landmarks are present on the Gaussian page", async ({ page }) => {
  await page.goto("/models/gaussian-normal");
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
});
