import { test, expect } from "@playwright/test";
import { readFile } from "fs/promises";
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
    // TODO use set with more than 4 sections, as test set only has 1 section, which make testing toggling hard
  });

  test("should have plot", async ({ page }) => {
    const canvas = page.locator(".chart-wrapper");
    await expect(canvas).toBeVisible();
  });

  test("should be able to download SVG", async ({ page }) => {
    // Open the vega action context menu aka ... icon
    await page.locator("summary").first().click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("text=Save as SVG").click(),
    ]);

    const svgPath = await download.path();
    const svgContent = await readFile(svgPath!, { encoding: "utf8" });
    expect(svgContent).toContain("Energy (eV)");
    // TODO check multiple sections are drawn
  });

  test.describe('when all checkboxes are unchecked', () => {
    test.beforeEach(async ({page}) => {
      page.locator("input[type=checkbox]").uncheck()
    })

    test('should show no plot', async ({page}) => {
      await expect(page.locator('text=Nothing to plot, because zero sections are selected')).toBeVisible()
    })
  })
});
