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

test.describe.skip("/author/scat-css", () => {
  test.beforeAll(async ({ browser }) => {
    await uploadAndPublishDummySet(browser);
    return db().dropNonUserCollections;
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/author/scat-css");
    await page.locator("button:text-is(\"Edit\")").click();
    await page.getByPlaceholder("Describe which changes have").fill(
      "Edited description",
    );
    await page.getByRole("button", { name: "Submit" }).click();
    await page.goto("/author/scat-css");
  });

  // FIXME: Playwright is too fast in its actions, and the expect calls
  // will receive incorrect data. We need to find a way to wait for all
  // async calls (that e.g. reload the page data) to finish before
  // continuing

  test("A simple edit should result in a draft", async ({ page }) => {
    await page.goto("/author/scat-css");

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

      // Status = published
      expect(table.locator("td").nth(1)).toHaveText("published");
      // Version = 1
      expect(table.locator("td").nth(3)).toHaveText("1");
    },
  );
});

test.describe.skip("/author/scat-css/add", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/author/scat-css/add");
  });
  test.describe("give empty name field", () => {
    test("after submit should show warning", async ({ page }) => {
      // With form untouched

      await page.locator("button:has-text(\"Submit\")").click();

      const warning = page.locator(
        "text=Name *must NOT have fewer than 1 characters",
      );
      await expect(warning).toBeVisible();
    });
  });

  async function addOrganization(name: string, page: Page) {
    await page.goto("/admin/organizations");
    await page.locator("[placeholder=\"Type new organization name\"]").fill(
      name,
    );
    await page.locator("button:has-text(\"Add\")").click();
    await page.goto("/admin/users");
    await page
      .locator("[aria-label=\"Memberships of admin\\@ng\\.lxcat\\.net\"]")
      .click();
    await page.locator(`text=${name}`).click();
  }

  async function fillAddSetForm(page: Page) {
    await page.goto("/author/scat-css/add");
    // General
    await page.locator("input[name=\"set\\.name\"]").fill("My name");
    await page
      .locator("select[name=\"set\\.contributor\"]")
      .selectOption("MyOrg");
    // States
    await page.locator("button[role=\"tab\"]:has-text(\"States\")").click();
    await page.locator("[aria-label=\"Add a state\"]").click();
    await page.locator("input[name=\"set\\.states\\.s0\\.particle\"]").fill(
      "Ar",
    );
    await page.locator("input[name=\"set\\.states\\.s0\\.charge\"]").fill("0");
    // Processes
    await page.locator("button[role=\"tab\"]:has-text(\"Processes\")").click();
    await page.locator("[aria-label=\"Add process\"]").click();
    await page.locator("[aria-label=\"Add data row to process\"]").click();
    await page
      .locator("input[name=\"set\\.processes\\.0\\.data\\.0\\.0\"]")
      .fill("1.2");
    await page
      .locator("input[name=\"set\\.processes\\.0\\.data\\.0\\.1\"]")
      .fill("3.4e-5");
    await page.locator("[aria-label=\"Add consumed reaction entry\"]").click();
    await page
      .locator(
        "[aria-controls=\"set\\.processes\\.0\\.reaction\\.lhs\\.0\\.state\"]",
      )
      .click();
    await page
      .locator("button[role=\"menuitem\"]:has-text(\"\\mathrm{Ar}\")")
      .click();
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
      await page.locator("button[role=\"tab\"]:has-text(\"JSON\")").click();
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
                  state: "s0",
                },
              ],
              rhs: [],
              reversible: false,
              type_tags: [],
            },
            threshold: 0,
            type: "LUT",
            labels: ["Energy", "CrossSection"],
            units: ["eV", "m^2"],
            data: [[1.2, 3.4e-5]],
            parameters: {},
          },
        ],
        states: {
          s0: {
            particle: "Ar",
            charge: 0,
          },
        },
        references: {},
      };
      expect(JSON.parse(json)).toEqual(expected);
    });

    test("after submit should have success message", async ({ page }) => {
      await page.locator("button:has-text(\"Submit\")").click();

      await expect(page.locator(".status")).toContainText("Adding successful");
    });
  });
});
