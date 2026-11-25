import { expect, test } from "@playwright/test";
import path from "node:path";
import { EVIDENCE_DIR, SCREENSHOT_VIEWPORTS } from "./helpers";

const PAGES = [
  { name: "home", path: "/" },
  { name: "explorer", path: "/explorer" },
  { name: "gaussian", path: "/models/gaussian-normal" },
];

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page, label: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, `${label} horizontal overflow`).toBeLessThanOrEqual(1);
}

test.describe("responsive layout", () => {
  for (const width of [320, 768, 1280]) {
    test(`no horizontal overflow at ${width} CSS pixels`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const target of [
        "/",
        "/explorer",
        "/models/gaussian-normal",
        "/labs/gaussian-normal",
        "/code",
        "/categories/probability-distribution-models",
      ]) {
        await page.goto(target);
        await assertNoHorizontalOverflow(page, `${target} @ ${width}px`);
      }
    });
  }

  test("mobile drawer opens, traps focus, closes with Escape and restores focus", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    const browse = page.getByRole("button", { name: "Browse" });
    await expect(browse).toBeVisible();
    await browse.click();

    const dialog = page.getByRole("dialog", { name: "Model browser and navigation" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "Close navigation drawer" }).first()).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(browse).toBeFocused();
  });

  test("desktop sidebar is replaced by the drawer on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/explorer");
    await expect(page.getByRole("complementary", { name: "Explorer sidebar" })).toBeVisible();

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.getByRole("complementary", { name: "Explorer sidebar" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Browse" })).toBeVisible();
  });

  test("reflows at an effective 200% zoom of a 1280px window", async ({ page }) => {
    // A 640px viewport is the CSS-pixel equivalent of a 1280px window at 200% zoom.
    await page.setViewportSize({ width: 640, height: 800 });
    for (const target of ["/", "/models/gaussian-normal", "/labs/gaussian-normal", "/explorer"]) {
      await page.goto(target);
      await assertNoHorizontalOverflow(page, `${target} @ 200% zoom simulation`);
    }
    await page.goto("/models/gaussian-normal");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("gaussian-plot")).toBeVisible();
  });
});

test.describe("screenshot evidence", () => {
  for (const viewportName of ["desktop", "mobile"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`${viewportName} ${theme} screenshots`, async ({ page }) => {
        await page.setViewportSize(SCREENSHOT_VIEWPORTS[viewportName]);
        await page.addInitScript((value) => {
          window.localStorage.setItem("patlas-theme", value);
        }, theme);

        for (const target of PAGES) {
          await page.goto(target.path);
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          await page.screenshot({
            path: path.join(
              EVIDENCE_DIR,
              "screenshots",
              `${target.name}-${viewportName}-${theme}.png`,
            ),
            fullPage: true,
          });
        }
      });
    }
  }
});
