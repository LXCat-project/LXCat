import { test, expect } from "@playwright/test";
import {
  uploadAndPublishDummySet,
  truncateNonUserCollections,
} from "./global-setup";

test.use({ storageState: "adminStorageState.json" });

test.describe("cross section set page", () => {
  test.beforeAll(async ({ browser }) => {
    await uploadAndPublishDummySet(browser);
  });

  test.afterAll(async () => {
    await truncateNonUserCollections();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/scat-css");
    await page.locator("text=Some name").click();
    await page.waitForSelector('h2:has-text("Processes")')
  });

  test("should have single process listed", async ({ page }) => {
    const processes = page.locator(".proceses-list li");
    await expect(processes).toHaveCount(1);
  });

  test("should have first 5 process plot checkboxes checked", async ({
    page,
  }) => {
    const checkboxes = page.locator("input[type=checkbox]");
    await expect(checkboxes).toBeChecked();
  });

  test("should have plot", async ({ page }) => {
    const canvas = page.locator(".chart-wrapper");
    await expect(canvas).toBeVisible();
  });
});
