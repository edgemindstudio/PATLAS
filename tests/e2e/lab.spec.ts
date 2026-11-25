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
    await expect(page.getByText(/The distribution is\s+unbounded/)).toBeVisible();

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

  test("rejects out-of-range parameters and keeps the last valid snapshot", async ({ page }) => {
    await page.goto("/labs/gaussian-normal");
    await page.getByTestId("mu-number").fill("2");
    await expect(statCell(page, "stat-mean")).toHaveText("2.00");

    await page.getByTestId("mu-number").fill("3.5");
    await expect(page.getByTestId("param-error")).toContainText("mu must be between -3 and 3");
    await expect(statCell(page, "stat-mean")).toHaveText("2.00");

    await page.getByTestId("sigma-number").fill("0");
    await expect(page.getByTestId("param-error")).toContainText("strictly positive");
    await expect(statCell(page, "stat-variance")).toHaveText("1.00");
  });

  test("reset returns to the approved defaults", async ({ page }) => {
    await page.goto("/labs/gaussian-normal");
    await page.getByTestId("mu-number").fill("-2.4");
    await page.getByTestId("sigma-number").fill("2.2");
    await expect(statCell(page, "stat-mean")).toHaveText("-2.40");

    await page.getByTestId("reset-lab").click();
    await expect(statCell(page, "stat-mean")).toHaveText("0.00");
    await expect(statCell(page, "stat-variance")).toHaveText("1.00");
    await expect(page.getByTestId("mu-number")).toHaveValue("0");
    await expect(page.getByTestId("python-source-preview")).toContainText("MU = 0.0");
  });

  test("sliders respond to arrow keys", async ({ page }) => {
    await page.goto("/labs/gaussian-normal");
    const slider = page.getByTestId("mu-slider");
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(statCell(page, "stat-mean")).toHaveText("0.10");
    await page.keyboard.press("ArrowLeft");
    await expect(statCell(page, "stat-mean")).toHaveText("0.00");
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

    const content = await page.evaluate(async () => {
      const response = await fetch("/models/gaussian-normal");
      return response.status;
    });
    expect(content).toBe(200);

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
