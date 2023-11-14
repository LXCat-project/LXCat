// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { expect, test } from "@playwright/test";
import { readFile } from "fs/promises";
import { uploadAndPublishDummySet } from "./global-setup";

test.use({ storageState: "adminStorageState.json" });

const csTest = test.extend({
  page: async ({ page }, use) => {
    // goto a section page
    await page.goto("/scat-cs");
    await page.locator("[aria-controls=\"particle-select\"]").first().click();
    await page
      .locator("button[role=\"menuitem\"]:has-text(\"\\mathrm{Uo}\")")
      .click();

    const row = page.getByRole("row", {
      name: "Some organization Some name 1 True",
    });
    await row.click();

    const csRow = page.getByRole("cell", { name: "Electronic", exact: true });
    await csRow.click();

    // accept tos
    await page.locator("text=I agree with the terms of use").click();

    await use(page);
  },
});

test.describe("Cross section page", () => {
  test.beforeAll(async ({ browser }) => {
    await db().setupCollections();
    await uploadAndPublishDummySet(browser);
  });

  test.afterAll(async () => {
    await db().truncateNonUserCollections();
  });

  csTest("should have plot", async ({ page }) => {
    const canvas = page.locator(".plot-container.plotly");
    await expect(canvas).toBeVisible();
  });

  csTest("should be able to download JSON format", async ({ page }) => {
    await page.locator("text=Download data").click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("text=JSON").click(),
    ]);

    const path = await download.path();
    const content = await readFile(path!, { encoding: "utf8" });
    expect(content).toContain("Energy");
  });

  csTest("should be able to download Plaintext format", async ({ page }) => {
    await page.locator("text=Download data").click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("text=Plaintext").click(),
    ]);

    const path = await download.path();
    const content = await readFile(path!, { encoding: "utf8" });
    expect(content).toContain("Energy");
  });

  csTest("should be able to download Bibtex references", async ({ page }) => {
    await page.locator("text=Download references").click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("text=Bibtex").click(),
    ]);

    const path = await download.path();
    const content = await readFile(path!, { encoding: "utf8" });

    expect(content).toContain("Data downloaded from");
    expect(content).toContain("Some main reference title");
  });

  csTest("should be able to download RIS references", async ({ page }) => {
    await page.locator("text=Download references").click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("text=RIS").click(),
    ]);

    const path = await download.path();
    const content = await readFile(path!, { encoding: "utf8" });

    expect(content).toContain("Data downloaded from");
    expect(content).toContain("Some main reference title");
  });
});
