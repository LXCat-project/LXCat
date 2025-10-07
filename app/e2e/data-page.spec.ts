// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile } from "fs/promises";
import { expect, test } from "playwright-test-coverage";
import { getSeededSet } from "./helpers";

test.use({ storageState: "adminStorageState.json" });

const csTest = test.extend({
  page: async ({ page, request }, use) => {
    // Go straight to the page of a single cross section.
    const { itemIds } = await getSeededSet(request);
    await page.goto(`/data/inspect?ids=${itemIds[0]}`);

    // accept tos
    await page.locator("text=I agree with the terms of use").click();

    await use(page);
  },
});

csTest.describe("Cross section page", () => {
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
