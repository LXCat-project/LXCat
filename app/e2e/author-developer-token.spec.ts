// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from "playwright-test-coverage";
import { bearer } from "./api-tokens";

test.use({ storageState: "adminStorageState.json" });

test("a token from the developer page gives access to the API", async ({ page, request }) => {
  await page.goto("/developer");
  await page.getByRole("button", { name: /generate token/ }).click();
  const token = await page.locator("textarea[readonly]").inputValue();
  expect(token).not.toEqual("");

  const res = await request.get("/api/scat-css", { headers: bearer(token) });
  expect(res.status()).toBe(200);
});
