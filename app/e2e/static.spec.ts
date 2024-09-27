// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from "playwright-test-coverage";

test("/", async ({ page }) => {
  await page.goto("/");
  const legend = page.locator("legend");
  await expect(legend).toContainText("List of data contributors");
});

test("/docs/0-index", async ({ page }) => {
  test.slow();
  await page.goto("/docs/0-index");
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
  const h1 = page.locator("h1");
  await expect(h1).toContainText("Team page");
});
