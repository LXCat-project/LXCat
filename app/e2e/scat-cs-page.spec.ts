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

test.describe("section page", () => {
  test.beforeAll(async ({ browser }) => {
    await uploadAndPublishDummySet(browser);
  });

  test.afterAll(async () => {
    await truncateNonUserCollections();
  });

  test.beforeEach(async ({ page }) => {
    // goto a section page
    await page.goto("/scat-cs");
    await page.locator('text=/.*Part of "Some name" set.*/').click();

    // accept tos
    await page.locator("text=I agree with the terms of use").click();
  });

  test("should have plot", async ({ page }) => {
    const canvas = page.locator(".chart-wrapper");
    await expect(canvas).toBeVisible();
  });

  test("should be able to download JSON format", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("text=Download JSON format").click(),
    ]);

    const path = await download.path();
    const content = await readFile(path!, { encoding: "utf8" });
    expect(content).toContain("Energy");
  });

  test.describe("Data as table", () => {
    test.beforeEach(async ({ page }) => {
      // Expand table
      await page.locator("text=Data as table").click();
    });

    test("should have 4 data points", async ({ page }) => {
      const rows = page.locator("table >> tr");
      await expect(rows).toHaveCount(
        4 + 1 // header row
      );
    });
  });
});
