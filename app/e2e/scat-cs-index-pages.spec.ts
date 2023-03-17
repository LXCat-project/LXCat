// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, Page, test } from "@playwright/test";
import { readFile } from "fs/promises";
import {
  truncateNonUserCollections,
  uploadAndPublishDummySet,
} from "./global-setup";

test.use({ storageState: "adminStorageState.json" });

test.beforeAll(async ({ browser }) => {
  await uploadAndPublishDummySet(browser);
  await uploadAndPublishDummySet(
    browser,
    "dummy2.json",
    "Some other organization",
  );
});

test.afterAll(async () => {
  await truncateNonUserCollections();
});

test.describe("cross section index page with Uo selected", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scat-cs");
    await page.locator("[aria-controls=\"particle-select\"]").first().click();
    await page
      .locator("button[role=\"menuitem\"]:has-text(\"\\mathrm{Uo}\")")
      .click();
  });

  // FIXME: How to uniquely locate consuming StateSelect and select Uo?
  test("should have 2 items listed", async ({ page }) => {
    const section1 = page.locator("text=/.*Part of \"Some name\" set.*/");
    const section2 = page.locator("text=/.*Part of \"Some other name\" set.*/");
    await expect(section1).toBeVisible();
    await expect(section2).toBeVisible();
  });

  test("should have link to bag page", async ({ page }) => {
    const baglink = page.locator("text=Plot selection");
    await expect(baglink).toBeVisible();
  });

  test.describe("when filtered on set name", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator("label:has-text(\"Some other organization\")").click();
    });

    test("should list single cross section", async ({ page }) => {
      const section2 = page.locator(
        "text=/.*Part of \"Some other name\" set.*/",
      );
      await expect(section2).toBeVisible();
    });
  });
});

test.describe("cross section set index page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scat-css");
  });

  test("should have 2 items listed", async ({ page }) => {
    const section1 = page.locator("text=Some organization");
    const section2 = page.locator("text=Some other organization");
    await expect(section1).toBeVisible();
    await expect(section2).toBeVisible();
  });

  test.describe("when filtered on electronic reaction type tag", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator("label:has-text(\"Electronic\")").click();
    });

    test("should list single section", async ({ page }) => {
      const section2 = page.locator("text=Some other organization");
      await expect(section2).toBeVisible();
    });
  });
});

const bagTest = (first: boolean) =>
  test.extend({
    page: async ({ page }, use) => {
      await page.goto("/scat-cs");
      await page.locator("[aria-controls=\"particle-select\"]").first().click();
      await page
        .locator("button[role=\"menuitem\"]:has-text(\"\\mathrm{Uo}\")")
        .click();
      await page.locator("text=Plot selection").click();
      // FIXME: This button needs to be clicked twice when clicked for the first time in dev mode. Maybe because its passing the pages/api boundary?
      first && await page.locator("text=Plot selection").click();
      await page.locator("text=I agree with the terms of use").click();
      await use(page);
    },
  });

test.describe("cross section bag page", () => {
  bagTest(true)("should be able to download JSON format", async ({ page }) => {
    test.setTimeout(60000);

    await page.locator("text=Download data").click();

    // this exercises the /api/scat-cs/bag endpoint
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("text=JSON").click(),
    ]);

    const path = await download.path();
    const content = await readFile(path!, { encoding: "utf8" });
    expect(content).toContain("Energy");
  });

  bagTest(false)("should have plot", async ({ page }) => {
    const canvas = page.locator(".plot-container.plotly");
    await expect(canvas).toBeVisible();
  });

  bagTest(false)("should have 2 items", async ({ page }) => {
    const table = page.locator("table:has(thead th:text(\"Reaction\"))");
    const secondCrossSection = table.locator("td span.katex").nth(1);

    table.highlight();

    await expect(secondCrossSection).toBeVisible();
  });
});
