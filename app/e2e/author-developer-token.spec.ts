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

  // Tokens without a name are listed as such.
  await expect(page.getByText("no name").first()).toBeVisible();

  const res = await request.get("/api/set", { headers: bearer(token) });
  expect(res.status()).toBe(200);
});

test("a token can be named, listed and revoked", async ({ page, request }) => {
  await page.goto("/developer");
  await page.getByLabel("Name").fill("My e2e token");
  await page.getByRole("button", { name: /generate token/ }).click();
  const token = await page.locator("textarea[readonly]").inputValue();

  const row = page.getByRole("row", { name: /My e2e token/ });
  await expect(row).toBeVisible();
  const status = async () =>
    (await request.get("/api/set", { headers: bearer(token) })).status();
  expect(await status()).toBe(200);

  // Revoking has to be confirmed.
  const dialog = page.getByRole("dialog");
  await row.getByRole("button", { name: "Revoke" }).click();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row).toBeVisible();
  expect(await status()).toBe(200);

  await row.getByRole("button", { name: "Revoke" }).click();
  await dialog.getByRole("button", { name: "Revoke" }).click();

  await expect(row).toHaveCount(0);
  expect(await status()).toBe(401);
  // The revoked token is not shown any longer.
  await expect(page.locator("textarea[readonly]")).toHaveCount(0);

  // The list is also correct after loading the page again.
  await page.reload();
  await expect(page.getByRole("row", { name: /My e2e token/ })).toHaveCount(0);
});

test("every generated token is shown", async ({ page, request }) => {
  await page.goto("/developer");
  const generate = page.getByRole("button", { name: /generate token/ });
  const shown = page.locator("textarea[readonly]");
  const revokeButtons = page.getByRole("button", { name: "Revoke" });

  const tokens: Array<string> = [];
  for (let i = 0; i < 2; i++) {
    const before = await revokeButtons.count();
    await generate.click();
    // The new token is stored, and listed, before it is read.
    await expect(revokeButtons).toHaveCount(before + 1);
    tokens.push(await shown.inputValue());
  }

  expect(tokens[1]).not.toEqual(tokens[0]);
  for (const token of tokens) {
    const res = await request.get("/api/set", { headers: bearer(token) });
    expect(res.status()).toBe(200);
  }
});
