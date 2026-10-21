// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from "@playwright/test";

test.use({ storageState: "adminStorageState.json" });

test("/api-doc", async ({ page }) => {
  await page.goto("/api-doc");
  const h1 = page.locator("h1");
  await expect(h1).toContainText("LXCat API");
  await expect(page.getByText("No page at this address")).toHaveCount(0);
});

test("/api-doc deep link survives a reload", async ({ page }) => {
  await page.goto("/api-doc");
  await expect(page.locator("h1")).toContainText("LXCat API");

  // Redoc routes every tag and operation to its own path below /api-doc.
  await page.getByRole("link", { name: "Species", exact: true }).click();
  await expect(page).toHaveURL(/\/api-doc\/.+/);

  await page.reload();
  await expect(page.getByText("No page at this address")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Species/ }).first())
    .toBeVisible();
});

test("/api-doc follows the color scheme toggle of the nav bar", async ({ page }) => {
  await page.goto("/api-doc");
  const html = page.locator("html");
  await expect(page.locator("h1")).toContainText("LXCat API");
  await expect(html).toHaveClass(/\blight\b/);

  await page.getByRole("button", { name: "Toggle color scheme" }).click();
  await expect(html).toHaveClass(/\bdark\b/);
  await expect(html).not.toHaveClass(/\blight\b/);

  await page.reload();
  await expect(page.locator("h1")).toContainText("LXCat API");
  await expect(html).toHaveClass(/\bdark\b/);

  // The nav bar is the only color scheme toggle on this page.
  await expect(page.getByTestId("color-mode-switcher")).toBeHidden();
});
