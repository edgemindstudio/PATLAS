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

  test("drawer isolates the background and wraps focus forward and backward", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Browse" }).click();

    const dialog = page.getByRole("dialog", { name: "Model browser and navigation" });
    await expect(dialog).toBeVisible();

    const backgroundInert = await page
      .locator("header")
      .evaluate((element) => element.closest("[inert]") !== null);
    expect(backgroundInert).toBe(true);

    const focusables = dialog.locator("a[href]:visible, button:not([disabled]):visible");
    const first = focusables.first();
    const last = focusables.last();

    await last.focus();
    await page.keyboard.press("Tab");
    await expect(first).toBeFocused();

    await first.focus();
    await page.keyboard.press("Shift+Tab");
    await expect(last).toBeFocused();

    // Programmatic focus on inert background content must not escape the modal.
    await page.locator("header a").first().evaluate((element) => element.focus());
    expect(
      await page.evaluate(() => document.activeElement?.closest("[role='dialog']") !== null),
    ).toBe(true);
  });

  test("drawer navigation and ordinary close both dismiss the modal", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    const browse = page.getByRole("button", { name: "Browse" });

    await browse.click();
    const dialog = page.getByRole("dialog", { name: "Model browser and navigation" });
    await dialog.getByRole("link", { name: "Explorer", exact: true }).click();
    await expect(page).toHaveURL(/\/explorer$/);
    await expect(dialog).toHaveCount(0);

    await browse.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Close navigation drawer" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(browse).toBeFocused();
  });

  test("taxonomy filter input keeps ordinary text-editing keys", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/explorer");
    const filter = page.getByLabel("Filter models");
    await filter.click();
    await filter.fill("gaussian");

    // Home/End and the arrow keys must be left to the browser's input editing
    // behaviour: focus and value stay under the user's control.
    await filter.press("End");
    await expect(filter).toBeFocused();
    await expect(filter).toHaveValue("gaussian");

    await filter.press("Home");
    await expect(filter).toBeFocused();
    await expect(filter).toHaveValue("gaussian");

    const caretBefore = await filter.evaluate((element) =>
      element instanceof HTMLInputElement ? element.selectionStart : null,
    );
    await filter.press("ArrowLeft");
    await expect(filter).toBeFocused();
    const caretAfter = await filter.evaluate((element) =>
      element instanceof HTMLInputElement ? element.selectionStart : null,
    );
    if (caretBefore !== null && caretAfter !== null) {
      expect(caretAfter).toBeLessThanOrEqual(caretBefore);
    }

    await filter.press("ArrowDown");
    await expect(filter).toBeFocused();
    await expect(filter).toHaveValue("gaussian");
  });

  test("tree disclosure and arrow navigation remain keyboard operable", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/explorer");
    const toggle = page
      .locator('nav[aria-label="Model taxonomy"] button[data-category-id]')
      .first();
    await toggle.focus();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("ArrowRight");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("ArrowDown");
    expect(
      await page.evaluate(() =>
        document.activeElement?.getAttribute("data-tree-focusable"),
      ),
    ).toBe("true");
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("A");
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
