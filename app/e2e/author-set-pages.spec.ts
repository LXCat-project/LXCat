// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile } from "fs/promises";
import { expect, test } from "playwright-test-coverage";
import { bearer } from "./api-tokens";
import { ADMIN_EMAIL, seedDir } from "./global-setup";
import { joinOrganizations, rootDb } from "./root-db";

test.use({ storageState: "adminStorageState.json" });

test.afterAll(async () => {
  await rootDb().truncateNonUserCollections();
});

test("only members of the organization of a set can open its editors", async ({ page, request }) => {
  const organization = "Editor organization";
  const userKey = await joinOrganizations(ADMIN_EMAIL, organization);

  try {
    const doc = JSON.parse(
      await readFile(`${seedDir}/dummy.json`, { encoding: "utf8" }),
    );
    doc.contributor = organization;
    const created = await request.post("/api/author/scat-css", {
      headers: bearer(),
      data: { doc, message: "Initial upload." },
    });
    expect(created.status()).toBe(200);
    const { id } = await created.json();

    // A member gets both editors.
    await page.goto(`/author/set/${id}/edit`);
    await expect(page.getByPlaceholder("Describe which changes have"))
      .toBeVisible();
    await page.goto(`/author/set/${id}/editraw`);
    await expect(
      page.getByRole("heading", {
        name: "Edit a scattering cross section set",
      }),
    ).toBeVisible();

    // An author who is not a member of the organization gets neither.
    await rootDb().stripAffiliations(userKey);
    for (const editor of ["edit", "editraw"]) {
      await page.goto(`/author/set/${id}/${editor}`);
      await expect(page.getByText("Forbidden", { exact: true }), editor)
        .toBeVisible();
    }
  } finally {
    await rootDb().stripAffiliations(userKey);
  }
});

test("a new set gets the only organization of the user as contributor", async ({ page, request }) => {
  const organization = "Single organization";
  const userKey = await joinOrganizations(ADMIN_EMAIL, organization);

  try {
    await page.goto("/author/set/add");
    // The contributor is not touched, the select already shows the only
    // organization.
    await expect(page.getByLabel("Contributor")).toHaveValue(organization);
    await page.getByLabel("Name *").fill("Set without contributor choice");
    await page.getByPlaceholder("Describe which changes have").fill("Add.");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Saved set with id")).toBeVisible();

    const listed =
      await (await request.get("/api/author/scat-css", { headers: bearer() }))
        .json();
    expect(listed.items).toEqual([
      expect.objectContaining({
        name: "Set without contributor choice",
        organization,
      }),
    ]);
  } finally {
    await rootDb().stripAffiliations(userKey);
  }
});
