import { expect, test } from "@playwright/test";
import { CATEGORIES, MODULES } from "./helpers";

const DESTINATIONS = [
  "/",
  "/explorer",
  "/foundations",
  "/labs",
  "/compare",
  "/paths",
  "/code",
];

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

test.describe("baseline routes", () => {
  test("all seven top-level destinations resolve", async ({ request }) => {
    for (const destination of DESTINATIONS) {
      const response = await request.get(destination);
      expect(response.status(), destination).toBe(200);
    }
  });

  test("all 109 canonical model routes resolve", async ({ request }) => {
    expect(MODULES).toHaveLength(109);
    const failures: string[] = [];
    for (const batch of chunk(MODULES, 16)) {
      const responses = await Promise.all(
        batch.map((module) => request.get(`/models/${module.id}`)),
      );
      responses.forEach((response, index) => {
        if (response.status() !== 200) {
          failures.push(`${batch[index]!.id}:${response.status()}`);
        }
      });
    }
    expect(failures).toEqual([]);
  });

  test("all 32 category routes resolve", async ({ request }) => {
    expect(CATEGORIES).toHaveLength(32);
    const failures: string[] = [];
    for (const batch of chunk(CATEGORIES, 16)) {
      const responses = await Promise.all(
        batch.map((category) => request.get(`/categories/${category.id}`)),
      );
      responses.forEach((response, index) => {
        if (response.status() !== 200) {
          failures.push(`${batch[index]!.id}:${response.status()}`);
        }
      });
    }
    expect(failures).toEqual([]);
  });

  test("unknown identifiers return a meaningful 404", async ({ page }) => {
    for (const path of ["/models/no-such-model", "/categories/no-such-category", "/labs/no-such-lab"]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
      await expect(page.getByRole("heading", { level: 1 })).toContainText("not in the atlas");
      await expect(page.getByRole("link", { name: "Open the model explorer" })).toBeVisible();
    }
  });

  test("duplicate HMM placements resolve to one canonical URL with three branches", async ({
    page,
  }) => {
    const response = await page.goto("/models/hidden-markov-models-hmm");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: "Hidden Markov Models (HMM)" }),
    ).toBeVisible();
    await expect(
      page.getByText(/This canonical model has 3 duplicate baseline placements/),
    ).toBeVisible();
    for (const branch of [
      "Directed Graphical Models",
      "Discrete Latent Variable Models",
      "Markov Models",
    ]) {
      await expect(
        page.getByRole("main").getByRole("link", { name: new RegExp(branch) }).first(),
      ).toBeVisible();
    }
  });

  test("planned model pages are honest and contain no fake lesson", async ({ page }) => {
    const response = await page.goto("/models/bernoulli");
    expect(response?.status()).toBe(200);
    await expect(page.getByText("Planned — no lesson has been written.")).toBeVisible();
    await expect(page.getByText(/M001 does not fabricate content/)).toBeVisible();
    await expect(page.locator("main")).not.toContainText("f(x) =");
  });

  test("the Gaussian module is reachable and labelled partial", async ({ page }) => {
    const response = await page.goto("/models/gaussian-normal");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Gaussian");
    await expect(page.getByText("Partial — independent review pending.")).toBeVisible();
    await expect(page.getByRole("img", { name: /Gaussian probability density/ })).toBeVisible();
  });
});

test("key pages emit no browser console or page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  for (const target of [
    "/",
    "/explorer",
    "/models/gaussian-normal",
    "/labs/gaussian-normal",
    "/categories/continuous-distributions",
    "/code",
    "/models/bernoulli",
  ]) {
    await page.goto(target);
    await page.waitForTimeout(150);
  }
  expect(errors).toEqual([]);
});
