// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from "playwright-test-coverage";
// import { rootDb } from "./root-db";

test.use({ storageState: "adminStorageState.json" });

// test.afterAll(async () => {
//   await rootDb().truncateNonUserCollections();
// });

test.describe("User panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByTitle("Logged in admin").click();
  });

  test("should have link to admin tasks", async ({ page }) => {
    const link = page.getByText("Admin", { exact: true });
    await expect(link).toBeVisible();
  });

  test("should have link to author tasks", async ({ page }) => {
    const link = page.getByText("Author", { exact: true });
    await expect(link).toBeVisible();
  });

  test("should have link to developer tasks", async ({ page }) => {
    const link = page.getByText("Developer", { exact: true });
    await expect(link).toBeVisible();
  });
});
