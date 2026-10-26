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
});
