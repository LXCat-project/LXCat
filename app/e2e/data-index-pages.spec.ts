// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile } from "fs/promises";
import { expect, test } from "playwright-test-coverage";
import { uploadAndPublishDummySet } from "./global-setup";
import { rootDb } from "./root-db";

test.use({ storageState: "adminStorageState.json" });

test.beforeAll(async ({ browser }) => {
  // await rootDb().setupCollections();
  // await rootDb().setupUserPrivileges(systemDb(), process.env.ARANGO_USERNAME!);

  await uploadAndPublishDummySet(browser);
  await uploadAndPublishDummySet(
    browser,
    "dummy2.json",
    "Some other organization",
  );
});

test.afterAll(async () => {
  await rootDb().truncateNonUserCollections();
});

test.describe("cross section index page with N2 selected", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data");
    await page.locator("[aria-controls=\"particle-select\"]").first().click();
    await page
      .locator("button[role=\"menuitem\"]:has-text(\"\\mathrm{N_{2}}\")")
      .click();
  });

  test("should have 2 items listed", async ({ page }) => {
    const section1 = page.locator("td:text(\"Some name\")");
    const section2 = page.locator("td:text(\"Some other name\")");
    await expect(section1).toBeVisible();
    await expect(section2).toBeVisible();
  });

  test("should have link to inspect page", async ({ page }) => {
    const inspectlink = page.locator("text=Plot selection");
    await expect(inspectlink).toBeVisible();
  });

  test.describe("when filtered on set name", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator("label:has-text(\"Some other organization\")").click();
    });

    test("should list single cross section", async ({ page }) => {
      const cs1 = page.locator("td:text(\"Some name\")");
      const cs2 = page.locator("td:text(\"Some other name\")");
      await expect(cs1).toHaveCount(0);
      await expect(cs2).toBeVisible();
    });
  });
});

test.describe("cross section inspect page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data");
    await page.locator("[aria-controls=\"particle-select\"]").first().click();
    await page
      .locator("button[role=\"menuitem\"]:has-text(\"\\mathrm{N_{2}}\")")
      .click();
    await page.locator("text=Plot selection").click();
    await page.locator("text=I agree with the terms of use").click();
  });

  test("should be able to download JSON format", async ({ page }) => {
    test.setTimeout(60000);

    await page.locator("text=Download data").click();

    // this exercises the /api/data/inspect endpoint
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("text=JSON").click(),
    ]);

    const path = await download.path();
    const content = await readFile(path!, { encoding: "utf8" });
    expect(content).toContain("Energy");
  });

  test("should have plot", async ({ page }) => {
    const canvas = page.locator(".plot-container.plotly");
    await expect(canvas).toBeVisible();
  });

  test("should have 2 items", async ({ page }) => {
    const table = page.locator("table:has(thead div:text(\"Reaction\"))");
    const secondCrossSection = table.locator("tbody tr").nth(1);

    table.highlight();

    await expect(secondCrossSection).toBeVisible();
  });
});
