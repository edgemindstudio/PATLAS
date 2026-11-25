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
  test("maintains a coherent combobox/listbox relationship in every state", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input");
    const listbox = page.locator('[role="listbox"]');

    const controls = await input.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    expect(
      await page.evaluate((id) => Boolean(id && document.getElementById(id)), controls),
    ).toBe(true);
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await expect(listbox).toHaveCount(1);
    await expect(listbox).toBeHidden();

    await input.fill("Hidden Markov Models");
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await expect(listbox).toBeVisible();
    await expect(page.getByRole("option").first()).toBeVisible();

    await input.press("ArrowDown");
    const activeId = await input.getAttribute("aria-activedescendant");
    expect(activeId).toBeTruthy();
    expect(
      await page.evaluate((id) => Boolean(id && document.getElementById(id)), activeId),
    ).toBe(true);
    expect(
      await page.evaluate((id) => document.getElementById(id!)?.getAttribute("role"), activeId),
    ).toBe("option");
    await expect(page.getByRole("option").first()).toHaveAttribute("aria-selected", "true");

    await input.press("Escape");
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await expect(listbox).toBeHidden();
  });

  test("supports keyboard selection through the real API", async ({ page }) => {
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

  test("supports mouse selection of a result option", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("search-input").fill("Gaussian (Normal)");
    const first = page.getByRole("option").first();
    await expect(first).toContainText("Gaussian (Normal)");
    await first.click();
    await expect(page).toHaveURL(/\/models\/gaussian-normal$/);
  });

  test("shows a no-results message and no stale active option", async ({ page }) => {
    await page.goto("/explorer");
    const input = page.getByTestId("search-input");
    await input.fill("zzzz-no-such-model-zzzz");
    await expect(page.getByText("No matches for “zzzz-no-such-model-zzzz”.")).toBeVisible();
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await expect(page.locator('[role="listbox"]')).toHaveCount(1);
    await expect(page.locator('[role="listbox"]')).toBeHidden();
  });

  test("clears a previous active option when results change", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("search-input");
    await input.fill("Gaussian");
    await expect(page.getByRole("option").first()).toBeVisible();
    await input.press("ArrowDown");
    await expect(input).toHaveAttribute("aria-activedescendant", /option-0$/);

    await input.fill("VAE");
    await expect(page.getByRole("option").first()).toBeVisible();
    const activeId = await input.getAttribute("aria-activedescendant");
    if (activeId) {
      expect(
        await page.evaluate((id) => Boolean(id && document.getElementById(id)), activeId),
      ).toBe(true);
    } else {
      expect(activeId).toBeNull();
    }
  });

  test("shows a loading state with an existing busy listbox", async ({ page }) => {
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
    const input = page.getByTestId("search-input");
    await input.fill("gaussian");
    await expect(page.getByText("Searching…")).toBeVisible();
    await expect(page.locator('[role="listbox"]')).toHaveAttribute("aria-busy", "true");
    await expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  test("shows a recoverable error state without stale option references", async ({ page }) => {
    await page.route("**/api/search**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Search is temporarily unavailable." }),
      }),
    );
    await page.goto("/");
    const input = page.getByTestId("search-input");
    await input.fill("gaussian");
    await expect(
      page.getByRole("alert").filter({ hasText: "Search is temporarily unavailable" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry search" })).toBeVisible();
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await expect(page.locator('[role="listbox"]')).toHaveCount(1);
  });
});
