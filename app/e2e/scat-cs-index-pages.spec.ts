import { test, expect } from "@playwright/test";
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
  test.only("should have 2 items listed", async ({ page }) => {
    const section1 = page.locator('text=/.*Part of "Some name" set.*/');
    const section2 = page.locator('text=/.*Part of "Some other name" set.*/');
    await expect(section1).toBeVisible();
    await expect(section2).toBeVisible();
  });

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
