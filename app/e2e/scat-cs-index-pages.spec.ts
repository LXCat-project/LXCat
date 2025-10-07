// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile } from "fs/promises";
import { expect, test } from "playwright-test-coverage";
import { clickUntilVisible, getSeededSet } from "./helpers";

test.use({ storageState: "adminStorageState.json" });

test.describe("cross section index page with N2 selected", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scat-cs");
    const n2 = page.locator(
      "button[role=\"menuitem\"]:has-text(\"\\mathrm{N_{2}}\")",
    );
    await clickUntilVisible(
      page.locator("[aria-controls=\"particle-select\"]").first(),
      n2,
    );
    await n2.click();
  });

  test("should have 2 items listed", async ({ page }) => {
    const section1 = page.locator("td:text(\"Some name\")");
    const section2 = page.locator("td:text(\"Some other name\")");
    await expect(section1).toBeVisible();
    await expect(section2).toBeVisible();
  });

  test("should have link to inspect page", async ({ page }) => {
    const inspectlink = page.locator("text=Plot selection");
    await expect(inspectlink).toBeVisible();
    await inspectlink.click();
    await expect(page).toHaveURL(/\/scat-cs\/inspect\?ids=/);
  });

  test.describe("when filtered on set name", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator("label:has-text(\"Some other organization\")").click();
    });

    test("should list single cross section", async ({ page }) => {
      const cs1 = page.locator("td:text(\"Some name\")");
      const cs2 = page.locator("td:text(\"Some other name\")");
      await expect(cs1).toHaveCount(0);
      await expect(cs2).toBeVisible();
    });
  });
});

test.describe("cross section inspect page", () => {
  test.beforeEach(async ({ page, request }) => {
    // Select the cross sections of both sets, as "Plot selection" does.
    const sets = await Promise.all([
      getSeededSet(request),
      getSeededSet(request, "Some other organization"),
    ]);
    const ids = sets.flatMap(({ itemIds }) => itemIds);
    await page.goto(`/scat-cs/inspect?ids=${ids.join(",")}`);
    await page.locator("text=I agree with the terms of use").click();
  });

  test("should be able to download JSON format", async ({ page }) => {
    test.setTimeout(60000);

    await page.locator("text=Download data").click();

    // the JSON is assembled in the browser from the page data
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("text=JSON").click(),
    ]);

    const path = await download.path();
    const content = await readFile(path!, { encoding: "utf8" });
    expect(content).toContain("Energy");
    expect(JSON.parse(content).$schema).toMatch(/\/api\/set\/LTPMixture$/);
  });

  test("should be able to download references in BibTeX format", async ({ page }) => {
    await page.locator("text=Download references").click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("text=Bibtex").click(),
    ]);

    expect(download.suggestedFilename()).toBe("LXCat_references.bib");
    const content = await readFile((await download.path())!, {
      encoding: "utf8",
    });
    // Starts with the reference to the selection itself.
    expect(content).toContain("Data downloaded from the {LXCat} platform.");
  });

  test("should have plot", async ({ page }) => {
    const canvas = page.locator(".plot-container.plotly");
    await expect(canvas).toBeVisible();
  });

  test("should have 2 items", async ({ page }) => {
    const table = page.locator("table:has(thead div:text(\"Reaction\"))");
    const secondCrossSection = table.locator("tbody tr").nth(1);

    table.highlight();

    await expect(secondCrossSection).toBeVisible();
  });
});
