// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Page } from "@playwright/test";
import { expect, test } from "playwright-test-coverage";
import { uploadAndPublishDummySet } from "./global-setup";
import { clickUntilVisible } from "./helpers";
import { rootDb } from "./root-db";

test.use({ storageState: "adminStorageState.json" });

// The tests below modify data and depend on each other, so run them in order.
test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  await rootDb().truncateNonUserCollections();
});

test("/api/author/scat-css", async ({ request }) => {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const resp = await request.get("/api/author/scat-css", { headers });
  expect(resp.ok()).toBeTruthy();
  const data = await resp.json();
  expect(data.items).toEqual([]);
});

test.describe("/author/set", () => {
  let publishedVersion = 1;

  const makeDraft = async (page: Page) => {
    await page.goto("/author/set");
    const description = page.getByPlaceholder("Describe which changes have");
    await clickUntilVisible(page.locator("svg.tabler-icon-edit"), description);
    await description.fill("Edited description");
    await page.getByRole("button", { name: "Submit" }).click();
    await page.getByText("Saved set with id").waitFor({ state: "visible" });
    await page.goto("/author/set");
  };

  test.beforeAll(async ({ browser }) => {
    await uploadAndPublishDummySet(browser);
  });

  test("A simple edit should result in a draft", async ({ page }) => {
    await makeDraft(page);

    const table = page.locator("table:has(thead div:text(\"Version\"))");

    await expect(table.locator("td").nth(1)).toHaveText("draft");
    await expect(table.locator("td").nth(3)).toHaveText(
      String(publishedVersion + 1),
    );
  });

  test("Publishing a draft should result in a new version", async ({ page }) => {
    await page.goto("/author/set");

    const publish = page.getByRole("button", { name: "Publish" });
    await clickUntilVisible(
      page.locator("svg.tabler-icon-file-check"),
      publish,
    );
    await publish.click();

    await page
      .getByText("Succesfully published the")
      .waitFor({ state: "visible" });

    publishedVersion += 1;

    const table = page.locator("table:has(thead div:text(\"Version\"))");
    await expect(table.locator("td").nth(1)).toHaveText("published");
    await expect(table.locator("td").nth(3)).toHaveText(
      String(publishedVersion),
    );
  });

  test(
    "Deleting a draft should revert to the previous, published version",
    async ({ page }) => {
      await makeDraft(page);

      const del = page.getByLabel("Are you sure you want to")
        .getByRole("button", { name: "Delete" });
      await clickUntilVisible(
        page.locator("svg.tabler-icon-trash:visible"),
        del,
      );
      await del.click();

      await page
        .getByText("Succesfully deleted the")
        .waitFor({ state: "visible" });

      const table = page.locator("table:has(thead div:text(\"Version\"))");

      await expect(table.locator("td").nth(1)).toHaveText("published");
      await expect(table.locator("td").nth(3)).toHaveText(
        String(publishedVersion),
      );
    },
  );

  test(
    "Retracting a published set should change the status to retracted",
    async ({ page }) => {
      await page.goto("/author/set");

      const retract = page.getByLabel("Are you sure you want to")
        .getByRole("button", { name: "Retract" });
      await clickUntilVisible(
        page.locator("svg.tabler-icon-trash:visible"),
        retract,
      );
      await retract.click();

      await page
        .getByText("Succesfully retracted the")
        .waitFor({ state: "visible" });

      const table = page.locator("table:has(thead div:text(\"Version\"))");

      await expect(table.locator("td").nth(1)).toHaveText("retracted");
      await expect(table.locator("td").nth(3)).toHaveText(
        String(publishedVersion),
      );
    },
  );
});

test.describe("/author/set/add", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/author/set/add");
  });
  test.describe("given empty name field", () => {
    test("after submit should show warning", async ({ page }) => {
      // With form untouched

      // The production build words this "Invalid input", `next dev` "Too small".
      const warning = page.getByText(/Invalid input|Too small/);
      await clickUntilVisible(
        page.locator("button:has-text(\"Submit\")"),
        warning.first(),
      );
      await expect(warning).toHaveCount(3);
    });
  });

  async function addOrganization(name: string, page: Page) {
    await page.goto("/admin/organizations");
    await page.locator("[placeholder=\"New organization name\"]").fill(
      name,
    );
    await clickUntilVisible(
      page.locator("button:has-text(\"Add\")"),
      page.getByRole("cell", { name: "MyOrg" }),
    );

    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    const option = page.locator(`text=${name}`);
    await clickUntilVisible(
      page.locator("div.mantine-MultiSelect-input"),
      option,
      { position: { x: 1, y: 1 } },
    );
    await option.click();
  }

  async function fillAddSetForm(page: Page) {
    await page.goto("/author/set/add");
    // General
    await page.getByLabel("Name *").fill("My name");
    await page.getByLabel("Contributor").selectOption("MyOrg");
    // States
    const addSpecies = page.getByRole("button", { name: "+" });
    await clickUntilVisible(
      page.getByRole("tab", { name: "Species" }),
      addSpecies,
    );
    await addSpecies.click();
    await page.locator("span.mantine-Accordion-label").first().click();
    await page.getByLabel("Species definition").fill(
      JSON.stringify({ type: "Atom", composition: [["Ar", 1]], charge: 0 }),
    );
    // Processes
    await page.getByRole("tab", { name: "Processes" }).click();
    await page.getByRole("button", { name: "Add process" }).click();
    await page.locator("span.mantine-Accordion-label").first().click();

    // Add reactant
    await page.getByRole("group", { name: "Reactants" }).getByRole("button")
      .click();
    await page
      .getByRole("group", { name: "Reactants" })
      .locator("button.mantine-UnstyledButton-root")
      .nth(2)
      .click();
    await page.getByLabel("", { exact: true }).click();

    // Add product
    await page.getByRole("group", { name: "Products" }).getByRole("button")
      .click();
    await page
      .getByRole("group", { name: "Products" })
      .locator("button.mantine-UnstyledButton-root")
      .nth(2)
      .click();
    await page.getByLabel("", { exact: true }).click();

    // Add data entry
    await page.getByRole("button", { name: "Add info object" }).click();
    await page.getByRole("button", { name: "Cross section" }).click();
    await page.locator("td").nth(1).locator("input").fill("1.2");
    await page.locator("td").nth(2).locator("input").fill("3.4e-5");
  }

  test.describe("given minimal set", () => {
    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();
      await addOrganization("MyOrg", page);
    });

    test.beforeEach(async ({ page }) => {
      await fillAddSetForm(page);
    });

    test("should have json document", async ({ page }) => {
      await page.getByRole("tab", { name: "JSON" }).click();
      const json = await page
        .getByRole("tabpanel", { name: "JSON" })
        .locator("pre")
        .innerText();
      const expected = {
        name: "My name",
        description: "",
        complete: false,
        contributor: "MyOrg",
        processes: [
          {
            reaction: {
              lhs: [
                {
                  count: 1,
                  state: expect.any(String),
                },
              ],
              rhs: [
                {
                  count: 1,
                  state: expect.any(String),
                },
              ],
              reversible: false,
              typeTags: [],
            },
            info: [
              {
                type: "CrossSection",
                threshold: 0,
                references: [],
                data: {
                  type: "LUT",
                  labels: ["Energy", "Cross Section"],
                  units: ["eV", "m^2"],
                  values: [[1.2, 3.4e-5]],
                },
              },
            ],
          },
        ],
        // TODO: This is not very strict, we can assert on the expected values.
        states: expect.any(Object),
        references: {},
      };
      expect(JSON.parse(json)).toEqual(expected);
    });

    test("after submit should have success message", async ({ page }) => {
      await page
        .getByPlaceholder("Describe which changes have")
        .fill("Initial upload");
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(page.getByText("Saved set with id")).toBeVisible();
    });
  });
});
