// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from "@playwright/test";
import { readFile } from "fs/promises";
import {
  truncateNonUserCollections,
  uploadAndPublishDummySet,
} from "./global-setup";

test.use({ storageState: "adminStorageState.json" });

const csTest = test.extend({
  page: async ({ page }, use) => {
    // goto a section page
    await page.goto("/scat-cs");
    await page.locator("[aria-controls=\"particle-select\"]").first().click();
    await page
      .locator("button[role=\"menuitem\"]:has-text(\"\\mathrm{Uo}\")")
      .click();

    const link = await page.locator("a[role=\"listitem\"]").getAttribute(
      "href",
    );
    await page.goto(link!);

    // accept tos
    await page.locator("text=I agree with the terms of use").click();

    await use(page);
  },
});

test.describe("Cross section page", () => {
  test.beforeAll(async ({ browser }) => {
    await uploadAndPublishDummySet(browser);
  });

  test.afterAll(async () => {
    await truncateNonUserCollections();
  });

  csTest("should have plot", async ({ page }) => {
    const canvas = page.locator(".chart-wrapper");
    await expect(canvas).toBeVisible();
  });

  csTest("should be able to download JSON format", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("text=Download JSON format").click(),
    ]);

    const path = await download.path();
    const content = await readFile(path!, { encoding: "utf8" });
    expect(content).toContain("Energy");
  });

  test.describe("Data as table", () => {
    csTest.beforeEach(async ({ page }) => {
      // Expand table
      await page.locator("text=Data as table").click();
    });

    csTest("should have 4 data points", async ({ page }) => {
      const rows = page.locator("table >> tr");
      await expect(rows).toHaveCount(
        4 + 1, // header row
      );
    });
  });
});
