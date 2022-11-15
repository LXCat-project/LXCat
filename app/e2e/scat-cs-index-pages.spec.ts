// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { test, expect } from "@playwright/test";
import { readFile } from "fs/promises";
import {
  uploadAndPublishDummySet,
  truncateNonUserCollections,
} from "./global-setup";

test.use({ storageState: "adminStorageState.json" });

test.beforeAll(async ({ browser }) => {
  await uploadAndPublishDummySet(browser);
  await uploadAndPublishDummySet(
    browser,
    "dummy2.json",
    "Some other organization"
  );
});

test.afterAll(async () => {
  await truncateNonUserCollections();
});

test.describe("cross section index page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scat-cs");
  });

  // FIXME: How to uniquely locate consuming StateSelect and select Uo?
  test("should have 2 items listed", async ({ page }) => {
    const section1 = page.locator('text=/.*Part of "Some name" set.*/');
    const section2 = page.locator('text=/.*Part of "Some other name" set.*/');
    await expect(section1).toBeVisible();
    await expect(section2).toBeVisible();
  });

  test('should have link to bag page', async ({page}) => {
    const baglink = page.locator('text=Plots and download the currently filtered cross sections')
    await expect(baglink).toBeVisible();
  })

  test.describe("when filtered on set name", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('label:has-text("Some other organization")').click();
    });

    test("should list single cross section", async ({ page }) => {
      const section2 = page.locator('text=/.*Part of "Some other name" set.*/');
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
      await page.locator('label:has-text("Electronic")').click();
    });

    test("should list single section", async ({ page }) => {
      const section2 = page.locator("text=Some other organization");
      await expect(section2).toBeVisible();
    });
  });
});

test.describe('cross section bag page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scat-cs");
    await page.locator('text=Plots and download the currently filtered cross sections').click();
    await page.locator("text=I agree with the terms of use").click();
  });

  test("should be able to download JSON format", async ({ page }) => {
    // this exercises the /api/scat-cs/bag endpoint
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("text=Download JSON format").click(),
    ]);

    const path = await download.path();
    const content = await readFile(path!, { encoding: "utf8" });
    expect(content).toContain("Energy");
  });

  test("should have plot", async ({ page }) => {
    const canvas = page.locator(".chart-wrapper");
    await expect(canvas).toBeVisible();
  });

  test('should have 2 items', async ({page}) => {
    const section1 = page.locator('text=Some name by Some organization')
    const section2 = page.locator('text=Some other name by Some other organization');
    await expect(section1).toBeVisible();
    await expect(section2).toBeVisible();
  })
})
