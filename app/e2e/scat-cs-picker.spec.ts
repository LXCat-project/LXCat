// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from "playwright-test-coverage";
import { clickUntilVisible } from "./helpers";

test.describe("reaction picker on the cross section index page", () => {
  test("a change sends one request that updates options and results", async ({ page }) => {
    // Next.js runs the server actions of a page one at a time, so every extra
    // action adds its full latency to a change of the selection.
    const actions: Array<string> = [];
    page.on("request", (request) => {
      if (request.headers()["next-action"]) {
        actions.push(request.url());
      }
    });

    await page.goto("/scat-cs");

    const products = page.getByRole("group", { name: "Right-hand side" });
    const productItems = page.getByRole("menuitem");
    const openProducts = async () => {
      await clickUntilVisible(
        products.locator("[data-button]").first(),
        productItems.first(),
      );
    };

    // Without a selection, every product of the seeded sets is offered: the
    // electron, N2, and N2+, which only the first set produces.
    await openProducts();
    await expect(productItems).toHaveCount(3);
    await page.keyboard.press("Escape");
    await expect(productItems).toHaveCount(0);
    expect(actions).toHaveLength(0);

    await page.locator("label:has-text(\"Some other organization\")").click();

    // The results and the URL follow the selection.
    await expect(page.locator("td:text(\"Some other name\")")).toBeVisible();
    await expect(page.locator("td:text(\"Some name\")")).toHaveCount(0);
    await expect(page).toHaveURL(/\/scat-cs\?reactions=/);
    expect(actions).toHaveLength(1);

    // The options follow the selection, N2+ is no longer produced.
    await openProducts();
    await expect(productItems).toHaveCount(2);
    expect(actions).toHaveLength(1);
  });

  test("an invalid selection in the URL gives the default selection", async ({ page }) => {
    for (const reactions of ["not json", "[{\"consumes\": 1}]"]) {
      await page.goto(`/scat-cs?reactions=${encodeURIComponent(reactions)}`);

      await expect(page.getByRole("group", { name: "Left-hand side" }))
        .toBeVisible();
      await expect(page.locator("td:text(\"Some name\")")).toHaveCount(0);
    }
  });

  test("a failed search is reported and does not change the selection", async ({ page }) => {
    await page.route(
      "**/scat-cs**",
      (route) =>
        route.request().headers()["next-action"]
          ? route.abort()
          : route.continue(),
    );

    await page.goto("/scat-cs");
    await page.locator("label:has-text(\"Some other organization\")").click();

    await expect(page.getByText("Could not search for cross sections"))
      .toBeVisible();
    await expect(page.locator("td:text(\"Some other name\")")).toHaveCount(0);
  });

  test("only the options of a changed reaction are requested", async ({ page }) => {
    // The second argument of the action holds the indices of the reactions
    // that the page does not have the options of.
    const requested: Array<Array<number>> = [];
    page.on("request", (request) => {
      if (request.headers()["next-action"]) {
        requested.push(JSON.parse(request.postData()!)[1]);
      }
    });

    await page.goto("/scat-cs");

    // The new reaction has the same template as the first one.
    await page.getByRole("button", { name: "Add Filter" }).click();
    await expect.poll(() => requested.length).toBe(1);

    // A change is applied when the response arrives, so wait for the results
    // before making the next one.
    const results = page.locator("td:text(\"Some other name\")");
    const set = page.locator("label:has-text(\"Some other organization\")");
    await set.click();
    await expect(results).toBeVisible();

    // Undoing the change gives a template the page has seen before.
    await set.click();
    await expect(results).toHaveCount(0);

    expect(requested).toEqual([[], [1], []]);
  });

  test("the sets are listed with their cross sections, which load when a set is expanded", async ({ page }) => {
    const actions: Array<string> = [];
    page.on("request", (request) => {
      if (request.headers()["next-action"]) {
        actions.push(request.url());
      }
    });

    await page.goto("/scat-cs");
    const n2 = page.locator(
      "button[role=\"menuitem\"]:has-text(\"\\mathrm{N_{2}}\")",
    );
    await clickUntilVisible(
      page.locator("[aria-controls=\"particle-select\"]").first(),
      n2,
    );
    await n2.click();

    // Every set that matches is listed, with its number of cross sections.
    await expect(page.getByText("2 cross sections in 2 sets")).toBeVisible();

    // The plot link holds the ids of these two cross sections.
    await expect(page.getByRole("link", { name: "Plot selection" }))
      .toHaveAttribute("href", /\/scat-cs\/inspect\?ids=\d+,\d+$/);
    const row = page.getByRole("row", { name: /Some other organization/ });
    await expect(row).toContainText("Some other name");
    // The cells are the database, set, number of cross sections and version.
    await expect(row.getByRole("cell").nth(2)).toHaveText("1");
    expect(actions).toHaveLength(1);

    // The cross sections of a set are only loaded when it is expanded.
    await expect(page.getByText("Threshold (eV)")).toHaveCount(0);
    await row.click();
    await expect(page.getByText("Threshold (eV)")).toBeVisible();
    await expect(page.getByText("1–1 of 1")).toBeVisible();
    expect(actions).toHaveLength(2);

    // Expanding it again does not load anything.
    await row.click();
    await row.click();
    await expect(page.getByText("Threshold (eV)")).toBeVisible();
    expect(actions).toHaveLength(2);
  });
});
