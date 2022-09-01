import { expect, test } from "@playwright/test";

test.use({ storageState: "adminStorageState.json" });

test.describe("/profile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
  });

  test("should have link to admin tasks", async ({ page }) => {
    const link = page.locator("text=Perform developer tasks");
    await expect(link).toBeVisible();
  });

  test("should have link to author tasks", async ({ page }) => {
    const link = page.locator("text=Perform author tasks");
    await expect(link).toBeVisible();
  });

  test("should have link to developer tasks", async ({ page }) => {
    const link = page.locator("text=Perform developer tasks");
    await expect(link).toBeVisible();
  });
});

test("/api/scat-css", async ({ request, page }) => {
  await page.pause();
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const resp = await request.get("/api/scat-css?private=true", { headers });
  expect(resp.ok()).toBeTruthy();
  const data = await resp.json();
  expect(data.items).toEqual([]);
});
