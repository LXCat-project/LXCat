// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from "@playwright/test";

test.use({ storageState: "adminStorageState.json" });

test("/api-doc", async ({ page }) => {
  await page.goto("/api-doc");
  const h1 = page.locator("h1");
  await expect(h1).toContainText("LXCat API");
});
