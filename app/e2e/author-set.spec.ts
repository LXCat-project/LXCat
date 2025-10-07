// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Page } from "@playwright/test";
import { readFile } from "fs/promises";
import { expect, test } from "playwright-test-coverage";
import { apiTokens, bearer } from "./api-tokens";
import { ADMIN_EMAIL, seedDir, uploadAndPublishDummySet } from "./global-setup";
import { joinOrganizations, rootDb } from "./root-db";

test.use({ storageState: "adminStorageState.json" });

// The tests below modify data and depend on each other, so run them in order.
test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  await rootDb().truncateNonUserCollections();
});

test("/api/author/set", async ({ request }) => {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...bearer(),
  };
  const resp = await request.get("/api/author/set", { headers });
  expect(resp.ok()).toBeTruthy();
  const data = await resp.json();
  expect(data.items).toEqual([]);
});

test("/api/author/set can create, edit, publish and retract a set", async ({ request }) => {
  const org = "API test organization";
  const userKey = await joinOrganizations(ADMIN_EMAIL, org);

  try {
    const doc = JSON.parse(
      await readFile(`${seedDir}/dummy.json`, { encoding: "utf8" }),
    );
    doc.contributor = org;
    const headers = bearer();

    // Only the author role may add sets, and only to one's own organization.
    const forbidden = await request.post("/api/author/set", {
      headers: bearer(apiTokens().noRoles),
      data: { doc, message: "Initial upload." },
    });
    expect(forbidden.status()).toBe(403);
    const foreign = await request.post("/api/author/set", {
      headers,
      data: { doc: { ...doc, contributor: "Other" }, message: "Upload." },
    });
    expect(foreign.status()).toBe(403);
    const invalid = await request.post("/api/author/set", {
      headers,
      data: { doc: { ...doc, name: undefined }, message: "Upload." },
    });
    expect(invalid.status()).toBe(400);

    const created = await request.post("/api/author/set", {
      headers,
      data: { doc, message: "Initial upload." },
    });
    expect(created.status()).toBe(200);
    const { id } = await created.json();

    const edited = await request.post(`/api/author/set/${id}`, {
      headers,
      data: { doc: { ...doc, description: "Edited" }, message: "Edit." },
    });
    expect(edited.status()).toBe(200);
    const { id: draftId } = await edited.json();

    const published = await request.post(
      `/api/author/set/${draftId}/publish`,
      { headers },
    );
    expect(published.status()).toBe(200);

    const listed = await request.get("/api/author/set", { headers });
    const { items } = await listed.json();
    expect(items).toEqual([
      expect.objectContaining({
        _key: draftId,
        name: doc.name,
        versionInfo: expect.objectContaining({ status: "published" }),
      }),
    ]);

    // A message is always required.
    const unexplained = await request.delete(
      `/api/author/set/${draftId}`,
      {
        headers,
        data: { message: "" },
      },
    );
    expect(unexplained.status()).toBe(400);
    const retracted = await request.delete(`/api/author/set/${draftId}`, {
      headers,
      data: { message: "Retract." },
    });
    expect(retracted.status()).toBe(200);
    const after = await (await request.get("/api/author/set", { headers }))
      .json();
    expect(after.items[0].versionInfo.status).toBe("retracted");
  } finally {
    await rootDb().stripAffiliations(userKey);
  }
});

test.describe("/author/set", () => {
  let publishedVersion = 1;

  const makeDraft = async (page: Page) => {
    await page.goto("/author/set");
    await page.locator("svg.tabler-icon-edit").click();
    await page.getByPlaceholder("Describe which changes have").fill(
      "Edited description",
    );
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

    await page.locator("svg.tabler-icon-file-check").click();
    await page.getByRole("button", { name: "Publish" }).click();

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

      await page.locator("svg.tabler-icon-trash:visible").click();
      await page.getByLabel("Are you sure you want to")
        .getByRole("button", { name: "Delete" })
        .click();

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

      await page.locator("svg.tabler-icon-trash:visible").click();
      await page.getByLabel("Are you sure you want to")
        .getByRole("button", { name: "Retract" })
        .click();

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

      await page.locator("button:has-text(\"Submit\")").click();

      // The production build words this "Invalid input", `next dev` "Too small".
      const warning = page.getByText(/Invalid input|Too small/);
      await expect(warning).toHaveCount(3);
    });
  });

  async function addOrganization(name: string, page: Page) {
    await page.goto("/admin/organizations");
    await page.locator("[placeholder=\"New organization name\"]").fill(
      name,
    );
    await page.locator("button:has-text(\"Add\")").click();
    await page
      .getByRole("cell", { name: "MyOrg" })
      .waitFor({ state: "visible" });

    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    await page
      .locator("tr", { hasText: ADMIN_EMAIL })
      .locator("div.mantine-MultiSelect-input")
      .click({ position: { x: 1, y: 1 } });
    await page.getByRole("option", { name }).click();
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
