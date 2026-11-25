import { expect, test } from "@playwright/test";

test.describe("search API over HTTP", () => {
  test("returns ranked Gaussian results with canonical URL and status", async ({ request }) => {
    const response = await request.get("/api/search?q=Gaussian%20(Normal)");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.count).toBeGreaterThan(0);
    expect(body.limit).toBe(20);
    expect(body.results[0].id).toBe("gaussian-normal");
    expect(body.results[0].url).toBe("/models/gaussian-normal");
    expect(body.results[0].status).toBe("partial");
    expect(body.results[0].type).toBe("model");
  });

  test("finds HMM through its alias and reports all branch paths", async ({ request }) => {
    const response = await request.get("/api/search?q=Hidden%20Markov%20Models");
    expect(response.status()).toBe(200);
    const body = await response.json();
    const hmm = body.results.find(
      (result: { id: string }) => result.id === "hidden-markov-models-hmm",
    );
    expect(hmm).toBeTruthy();
    expect(hmm.matchedOn).toBe("alias");
    expect(hmm.branches).toHaveLength(3);
    expect(hmm.branches.map((branch: { labels: string[] }) => branch.labels[1])).toEqual([
      "Directed Graphical Models",
      "Discrete Latent Variable Models",
      "Markov Models",
    ]);
  });

  test("searches categories", async ({ request }) => {
    const response = await request.get("/api/search?q=Continuous%20Distributions");
    const body = await response.json();
    const category = body.results.find(
      (result: { id: string }) => result.id === "continuous-distributions",
    );
    expect(category.type).toBe("category");
    expect(category.url).toBe("/categories/continuous-distributions");
  });

  test("returns 200 with empty results for unknown and empty queries", async ({ request }) => {
    for (const path of ["/api/search?q=zzzz-unknown", "/api/search?q=", "/api/search"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      const body = await response.json();
      expect(body.count).toBe(0);
      expect(body.results).toEqual([]);
    }
  });

  test("rejects duplicate, overlong and control-character queries", async ({ request }) => {
    for (const path of [
      "/api/search?q=a&q=b",
      `/api/search?q=${"a".repeat(129)}`,
      "/api/search?q=%00",
    ]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(400);
      const body = await response.json();
      expect(body.code).toBe("invalid-query");
    }
  });

  test("does not leak internal paths or filenames", async ({ request }) => {
    const response = await request.get("/api/search?q=a");
    const text = JSON.stringify(await response.json());
    expect(text).not.toContain("/Users/");
    expect(text).not.toContain("registry/baseline");
    expect(text).not.toContain(".json");
  });
});

test.describe("search interface", () => {
  test("uses the real endpoint and supports keyboard selection", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input");
    await input.fill("Hidden Markov Models");
    const options = page.getByRole("option");
    await expect(options.first()).toBeVisible();
    await expect(options.first()).toContainText("Hidden Markov Models (HMM)");

    await input.press("ArrowDown");
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/models\/hidden-markov-models-hmm$/);
  });

  test("shows a no-results message for unknown queries", async ({ page }) => {
    await page.goto("/explorer");
    await page.getByTestId("search-input").fill("zzzz-no-such-model-zzzz");
    await expect(page.getByText("No matches for “zzzz-no-such-model-zzzz”.")).toBeVisible();
  });

  test("Escape closes the results panel", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input");
    await input.fill("Gaussian");
    await expect(page.getByRole("option").first()).toBeVisible();
    await input.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
  });
});

test("shows a loading state before results arrive", async ({ page }) => {
  await page.route("**/api/search**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        query: "gaussian",
        normalizedQuery: "gaussian",
        count: 0,
        limit: 20,
        results: [],
      }),
    });
  });
  await page.goto("/");
  await page.getByTestId("search-input").fill("gaussian");
  await expect(page.getByText("Searching…")).toBeVisible();
});

test("shows a recoverable error state when the endpoint fails", async ({ page }) => {
  await page.route("**/api/search**", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Search is temporarily unavailable." }),
    }),
  );
  await page.goto("/");
  await page.getByTestId("search-input").fill("gaussian");
  await expect(
    page.getByRole("alert").filter({ hasText: "Search is temporarily unavailable" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry search" })).toBeVisible();
});
