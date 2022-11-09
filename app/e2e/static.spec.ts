// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { test, expect } from "@playwright/test";

test("/", async ({ page }) => {
  await page.goto("/");
  const h1 = page.locator("h1");
  await expect(h1).toContainText("Welcome to LXCat");
});

test("/docs/index", async ({ page }) => {
  test.slow();
  await page.goto("/docs/index");
  const h1 = page.locator("h1");
  await expect(h1).toContainText("LXCat documentation");
});
// TODO test docs/* pages work

test("/data-center", async ({ page }) => {
  await page.goto("/data-center");
  const h1 = page.locator("h1");
  await expect(h1).toContainText("Data center");
});

test("/team", async ({ page }) => {
  await page.goto("/team");
  const title = page.locator("head title");
  await expect(title).toContainText("Team");
});
