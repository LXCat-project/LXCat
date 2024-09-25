// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { Page } from "@playwright/test";
import { expect, test } from "playwright-test-coverage";
import { uploadAndPublishDummySet } from "./global-setup";
import { rootDb } from "./root-db";

test.use({ storageState: "adminStorageState.json" });

// test.beforeAll(async () => {
//   await rootDb().setupCollections();
//   await rootDb().setupUserPrivileges(systemDb(), process.env.ARANGO_USERNAME!);
// });

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

test.describe.skip("/author/set", () => {
  test.beforeAll(async ({ browser }) => {
    await uploadAndPublishDummySet(browser);
    return db().dropNonUserCollections;
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/author/set");
    await page.locator("button:text-is(\"Edit\")").click();
    await page.getByPlaceholder("Describe which changes have").fill(
      "Edited description",
    );
    await page.getByRole("button", { name: "Submit" }).click();
    await page.getByText("Saved set with id").waitFor({ state: "visible" });
    await page.goto("/author/set");
  });

  test("A simple edit should result in a draft", async ({ page }) => {
    await page.goto("/author/set");

    const table = page.locator("table:has(thead th:text(\"Version\"))");

    // Status = draft
    expect(table.locator("td").nth(1)).toHaveText("draft");
    // Version = 2
    expect(table.locator("td").nth(3)).toHaveText("2");
  });

  test(
    "Deleting a draft should revert to the previous, published version",
    async ({ page }) => {
      await page.locator("button:text-is(\"Delete\"):visible").click();
      await page.locator("button[type=\"submit\"]:text-is(\"Delete\")")
        .click();

      const table = page.locator("table:has(thead th:text(\"Version\"))");
      await page.locator("button:text-is(\"Delete\"):visible").waitFor({
        state: "hidden",
      });

      // Status = published
      expect(table.locator("td").nth(1)).toHaveText("published");
      // Version = 1
      expect(table.locator("td").nth(3)).toHaveText("1");
    },
  );
});

test.describe("/author/set/add", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/author/set/add");
  });
  test.describe("give empty name field", () => {
    test("after submit should show warning", async ({ page }) => {
      // With form untouched

      await page.locator("button:has-text(\"Submit\")").click();

      const warning = page.getByText(
        "String must contain at least 1 character(s)",
      );
      await expect(warning).toHaveCount(3);
    });
  });

  async function addOrganization(name: string, page: Page) {
    await page.goto("/admin/organizations");
    await page.locator("[placeholder=\"Type new organization name\"]").fill(
      name,
    );
    await page.locator("button:has-text(\"Add\")").click();
    await page.locator("li").getByText(name).waitFor({ state: "visible" });

    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    await page
      .getByRole("row", { name: "admin admin@ng.lxcat.net" }).locator("div")
      .first()
      .click();
    await page.locator(`text=${name}`).click();
  }

  async function fillAddSetForm(page: Page) {
    await page.goto("/author/set/add");
    // General
    await page.getByLabel("Name *").fill("My name");
    await page.getByLabel("Contributor").selectOption("MyOrg");
    // States
    await page.getByRole("tab", { name: "Species" }).click();
    await page.getByRole("button", { name: "+" }).click();
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
    await page.getByRole("menuitem").click();

    // Add product
    await page.getByRole("group", { name: "Products" }).getByRole("button")
      .click();
    await page
      .getByRole("group", { name: "Products" })
      .locator("button.mantine-UnstyledButton-root")
      .nth(2)
      .click();
    await page.getByRole("menuitem").click();

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
      const json = await page.locator("pre").innerText();
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
