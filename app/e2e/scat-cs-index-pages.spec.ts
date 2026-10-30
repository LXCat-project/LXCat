// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile } from "fs/promises";
import { expect, test } from "playwright-test-coverage";
import { getSeededSet, selectConsumed } from "./helpers";

test.use({ storageState: "adminStorageState.json" });

test.describe("cross section index page with N2 selected", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scat-cs");
    await selectConsumed(page, "\\mathrm{N_{2}}");
  });

  test("should have 2 items listed", async ({ page }) => {
    const section1 = page.locator("td:text(\"Some name\")");
    const section2 = page.locator("td:text(\"Some other name\")");
    await expect(section1).toBeVisible();
    await expect(section2).toBeVisible();
  });

  test("should have link to inspect page", async ({ page }) => {
    const inspectlink = page.getByRole("link", { name: "Plot selection" });
    // The link holds the ids of the two cross sections.
    await expect(inspectlink).toHaveAttribute(
      "href",
      /\/scat-cs\/inspect\?ids=\d+,\d+$/,
    );
    await inspectlink.click();
    await expect(page).toHaveURL(/\/scat-cs\/inspect\?ids=/);
  });

  test("should list the sets with their cross sections, which load when a set is expanded", async ({ page }) => {
    // Every set that matches is listed, with its number of cross sections.
    await expect(page.getByText("2 cross sections in 2 sets")).toBeVisible();

    // The search of the selection is done, so only later requests count.
    const actions: Array<string> = [];
    page.on("request", (request) => {
      if (request.headers()["next-action"]) {
        actions.push(request.url());
      }
    });

    const row = page.getByRole("row", { name: /Some other organization/ });
    await expect(row).toContainText("Some other name");
    // The cells are the database, set, number of cross sections and version.
    await expect(row.getByRole("cell").nth(2)).toHaveText("1");

    // The cross sections of a set are only loaded when it is expanded.
    await expect(page.getByText("Threshold (eV)")).toHaveCount(0);
    await row.click();
    await expect(page.getByText("Threshold (eV)")).toBeVisible();
    await expect(page.getByText("1–1 of 1")).toBeVisible();
    expect(actions).toHaveLength(1);

    // Expanding it again does not load anything.
    await row.click();
    await row.click();
    await expect(page.getByText("Threshold (eV)")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(actions).toHaveLength(1);
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
    expect(JSON.parse(content).$schema).toMatch(/\/api\/scat-css\/LTPMixture$/);
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

  test("should select and deselect all processes with the header checkbox", async ({ page }) => {
    const table = page.locator("table:has(thead div:text(\"Reaction\"))");
    const header = table.getByRole("checkbox", { name: "Select all records" });
    const rows = table.locator("tbody").getByRole("checkbox");

    // Both processes are selected initially.
    await expect(header).toBeChecked();

    await header.click();
    await expect(header).not.toBeChecked();
    await expect(rows.nth(0)).not.toBeChecked();
    await expect(rows.nth(1)).not.toBeChecked();

    await header.click();
    await expect(header).toBeChecked();
    await expect(rows.nth(0)).toBeChecked();
    await expect(rows.nth(1)).toBeChecked();
  });

  test("should deselect all processes with the header checkbox when some are selected", async ({ page }) => {
    const table = page.locator("table:has(thead div:text(\"Reaction\"))");
    const header = table.getByRole("checkbox", { name: "Select all records" });
    const rows = table.locator("tbody").getByRole("checkbox");

    await rows.nth(0).click();
    await expect(header).not.toBeChecked();
    await expect(header).toHaveJSProperty("indeterminate", true);

    // Instead of selecting the process that is left out.
    await header.click();
    await expect(rows.nth(0)).not.toBeChecked();
    await expect(rows.nth(1)).not.toBeChecked();
    await expect(header).toHaveJSProperty("indeterminate", false);
  });

  test("should limit the height of the table of sets", async ({ page }) => {
    const viewport = page.locator(
      ".mantine-datatable:has(th:has-text(\"Set name\"))",
    )
      .locator(".mantine-ScrollArea-viewport");

    await expect(viewport).toHaveCSS("max-height", "300px");
  });

  test("should filter the processes on database and set", async ({ page }) => {
    const table = page.locator("table:has(thead div:text(\"Reaction\"))");
    const rows = table.locator("tbody tr");
    const filterOf = (column: string) =>
      table.locator("th", { hasText: column }).locator(
        ".mantine-datatable-header-cell-filter-action-icon",
      );
    await expect(rows).toHaveCount(2);

    await filterOf("Database").click();
    await page.getByRole("combobox", { name: "Databases" }).click();
    await page.getByRole("option", { name: "Some other organization" })
      .click();
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Some other organization");
    await expect(filterOf("Database")).toHaveAttribute("data-active", "true");
    await page.keyboard.press("Escape");

    // The sets that are left are those of the chosen database.
    await filterOf("Set").click();
    await page.getByRole("combobox", { name: "Sets" }).click();
    await expect(page.getByRole("option")).toHaveCount(1);
  });

  test("should have 2 items", async ({ page }) => {
    const table = page.locator("table:has(thead div:text(\"Reaction\"))");
    const secondCrossSection = table.locator("tbody tr").nth(1);

    table.highlight();

    await expect(secondCrossSection).toBeVisible();
  });
});
