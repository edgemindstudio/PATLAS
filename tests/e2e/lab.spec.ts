import { expect, test } from "@playwright/test";
import { collectConsoleErrors, EVIDENCE_DIR } from "./helpers";
import path from "node:path";

function statCell(page: import("@playwright/test").Page, testId: string) {
  return page.getByTestId(testId);
}

test.describe("Gaussian laboratory", () => {
  test("default snapshot drives plot, equations, statistics and source", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/labs/gaussian-normal");

    await expect(statCell(page, "stat-mean")).toHaveText("0.00");
    await expect(statCell(page, "stat-variance")).toHaveText("1.00");
    await expect(statCell(page, "stat-peak")).toHaveText("0.3989");
    await expect(page.getByTestId("dynamic-equation")).toContainText("μ = 0.00");
    await expect(page.getByTestId("dynamic-equation")).toContainText("σ² = 1.00");
    await expect(page.getByTestId("python-source-preview")).toContainText("MU = 0.0");
    await expect(page.getByTestId("python-source-preview")).toContainText("SIGMA = 1.0");

    const plot = page.getByTestId("gaussian-plot");
    await expect(plot).toHaveAttribute("aria-labelledby", /gaussian-plot-title/);
    await expect(plot).toHaveAttribute("aria-labelledby", /gaussian-plot-desc/);
    await expect(plot.locator("title")).toContainText("Gaussian probability density");
    await expect(plot.locator("desc")).toContainText("68.27 percent");
    await expect(plot.locator("desc")).toContainText("finite display window");
    await expect(page.getByText(/The distribution is\s+unbounded/)).toBeVisible();
    await expect(page.getByTestId("lab-statistics").locator("caption")).toContainText(
      "density is not probability",
    );

    expect(errors).toEqual([]);
  });

  test("parameters stay synchronised across plot, equation, statistics and Python", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/labs/gaussian-normal");
    const before = await page.getByTestId("gaussian-plot").innerHTML();

    await page.getByTestId("mu-number").fill("2");
    await page.getByTestId("sigma-number").fill("1.5");

    await expect(statCell(page, "stat-mean")).toHaveText("2.00");
    await expect(statCell(page, "stat-variance")).toHaveText("2.25");
    await expect(page.getByTestId("dynamic-equation")).toContainText("μ = 2.00");
    await expect(page.getByTestId("dynamic-equation")).toContainText("σ² = 2.25");
    await expect(page.getByTestId("python-source-preview")).toContainText("MU = 2.0");
    await expect(page.getByTestId("python-source-preview")).toContainText("SIGMA = 1.5");

    const after = await page.getByTestId("gaussian-plot").innerHTML();
    expect(after).not.toBe(before);

    expect(errors).toEqual([]);
  });

  test("rejects out-of-range numeric input and keeps the last applied snapshot", async ({
    page,
  }) => {
    await page.goto("/labs/gaussian-normal");
    await page.getByTestId("mu-number").fill("2");
    await expect(statCell(page, "stat-mean")).toHaveText("2.00");

    await page.getByTestId("mu-number").fill("3.5");
    await expect(page.getByTestId("mu-error")).toContainText("μ must be between -3 and 3");
    await expect(page.getByTestId("mu-applied")).toContainText("μ = 2.00");
    await expect(statCell(page, "stat-mean")).toHaveText("2.00");

    await page.getByTestId("sigma-number").fill("0");
    await expect(page.getByTestId("sigma-error")).toContainText("σ must be between 0.5 and 2.5");
    await expect(statCell(page, "stat-variance")).toHaveText("1.00");
  });

  test("rejects off-grid numeric input with an accessible explanation", async ({ page }) => {
    await page.goto("/labs/gaussian-normal");
    const before = await page.getByTestId("gaussian-plot").innerHTML();

    await page.getByTestId("mu-number").fill("0.15");
    await expect(page.getByTestId("mu-error")).toContainText("μ must be on the 0.1 step grid");
    await expect(page.getByTestId("mu-error")).toContainText("Nearest allowed values are 0.1 and 0.2");
    await expect(page.getByTestId("mu-error")).toContainText("still use μ = 0.00");
    await expect(page.getByTestId("mu-applied")).toContainText("μ = 0.00");
    await expect(page.getByTestId("mu-number")).toHaveAttribute("aria-invalid", "true");

    // The applied snapshot must not move: plot, statistics, equation and export.
    expect(await page.getByTestId("gaussian-plot").innerHTML()).toBe(before);
    await expect(statCell(page, "stat-mean")).toHaveText("0.00");
    await expect(page.getByTestId("dynamic-equation")).toContainText("μ = 0.00");
    await expect(page.getByTestId("python-source-preview")).toContainText("MU = 0.0");
    await expect(page.getByTestId("mu-slider")).toHaveValue("0");
  });

  test("keeps independent error state when the other field changes", async ({ page }) => {
    await page.goto("/labs/gaussian-normal");
    await page.getByTestId("mu-number").fill("0.15");
    await expect(page.getByTestId("mu-error")).toBeVisible();

    await page.getByTestId("sigma-number").fill("1.5");
    await expect(page.getByTestId("sigma-error")).toHaveCount(0);
    await expect(page.getByTestId("mu-error")).toBeVisible();
    await expect(page.getByTestId("mu-error")).toContainText("step grid");
    await expect(statCell(page, "stat-sigma")).toHaveText("1.50");
  });

  test("accepts both approved parameter boundaries", async ({ page }) => {
    await page.goto("/labs/gaussian-normal");

    await page.getByTestId("mu-number").fill("3");
    await page.getByTestId("sigma-number").fill("0.5");
    await expect(statCell(page, "stat-mean")).toHaveText("3.00");
    await expect(statCell(page, "stat-sigma")).toHaveText("0.50");
    await expect(page.getByTestId("mu-error")).toHaveCount(0);
    await expect(page.getByTestId("sigma-error")).toHaveCount(0);
    await expect(page.getByTestId("python-source-preview")).toContainText("MU = 3.0");
    await expect(page.getByTestId("python-source-preview")).toContainText("SIGMA = 0.5");

    await page.getByTestId("mu-number").fill("-3");
    await page.getByTestId("sigma-number").fill("2.5");
    await expect(statCell(page, "stat-mean")).toHaveText("-3.00");
    await expect(statCell(page, "stat-variance")).toHaveText("6.25");
    await expect(page.getByTestId("python-source-preview")).toContainText("MU = -3.0");
    await expect(page.getByTestId("python-source-preview")).toContainText("SIGMA = 2.5");
  });

  test("keeps slider and numeric field synchronised in both directions", async ({ page }) => {
    await page.goto("/labs/gaussian-normal");
    const slider = page.getByTestId("mu-slider");
    await slider.focus();
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press("ArrowRight");
    }
    await expect(slider).toHaveValue("1.2");
    await expect(page.getByTestId("mu-number")).toHaveValue("1.2");
    await expect(statCell(page, "stat-mean")).toHaveText("1.20");

    await page.getByTestId("mu-number").fill("2.3");
    await expect(slider).toHaveValue("2.3");
    await expect(statCell(page, "stat-mean")).toHaveText("2.30");
  });

  test("reset clears errors and returns to the approved defaults", async ({ page }) => {
    await page.goto("/labs/gaussian-normal");
    await page.getByTestId("mu-number").fill("0.15");
    await page.getByTestId("sigma-number").fill("2.55");
    await expect(page.getByTestId("mu-error")).toBeVisible();
    await expect(page.getByTestId("sigma-error")).toBeVisible();

    await page.getByTestId("reset-lab").click();
    await expect(page.getByTestId("mu-error")).toHaveCount(0);
    await expect(page.getByTestId("sigma-error")).toHaveCount(0);
    await expect(page.getByTestId("mu-number")).toHaveValue("0");
    await expect(page.getByTestId("sigma-number")).toHaveValue("1");
    await expect(statCell(page, "stat-mean")).toHaveText("0.00");
    await expect(page.getByTestId("python-source-preview")).toContainText("MU = 0.0");
  });

  test("downloads Python source matching the current snapshot", async ({ page }) => {
    await page.goto("/labs/gaussian-normal");
    await page.getByTestId("mu-number").fill("1.2");
    await page.getByTestId("sigma-number").fill("0.8");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("download-python").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("patlas_gaussian_snapshot.py");
    const target = path.join(EVIDENCE_DIR, "downloads", "patlas_gaussian_snapshot.py");
    await download.saveAs(target);

    const { readFileSync } = await import("node:fs");
    const source = readFileSync(target, "utf8");
    expect(source).toContain("MU = 1.2");
    expect(source).toContain("SIGMA = 0.8");
    expect(source).toContain("X_MIN = -12.0");
    expect(source).toContain("X_MAX = 12.0");
    expect(source).toContain("scipy.stats");
  });

  test("copies source to the clipboard", async ({ page }) => {
    await page.goto("/labs/gaussian-normal");
    await page.getByTestId("copy-python").click();
    await expect(page.getByText("Copied to the clipboard.", { exact: true })).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain("MU = 0.0");
    expect(clipboard).toContain("SIGMA = 1.0");
  });

  test("offers manual copy when clipboard access fails", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "clipboard", {
        configurable: true,
        get() {
          return {
            writeText: () => Promise.reject(new Error("blocked by test")),
          };
        },
      });
    });
    await page.goto("/labs/gaussian-normal");
    await page.getByTestId("copy-python").click();
    const area = page.getByTestId("manual-copy-area");
    await expect(area).toBeVisible();
    await expect(area).toHaveValue(/MU = 0\.0/);
    await expect(page.getByRole("alert").filter({ hasText: "Clipboard access failed" })).toBeVisible();
  });
});
