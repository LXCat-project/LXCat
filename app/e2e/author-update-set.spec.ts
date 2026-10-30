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

test("the contributor of a set cannot be changed", async ({ request }) => {
  const [own, sibling, foreign] = [
    "Own organization",
    "Sibling organization",
    "Foreign organization",
  ];
  await rootDb().upsertOrganization(foreign);
  const userKey = await joinOrganizations(ADMIN_EMAIL, own, sibling);

  try {
    const doc = JSON.parse(
      await readFile(`${seedDir}/dummy.json`, { encoding: "utf8" }),
    );
    doc.contributor = own;
    const headers = bearer();

    const created = await request.post("/api/author/scat-css", {
      headers,
      data: { doc, message: "Initial upload." },
    });
    expect(created.status()).toBe(200);
    const { id } = await created.json();

    // Both an organization of the user and one they are not a member of.
    for (const contributor of [sibling, foreign]) {
      const moved = await request.post(`/api/author/scat-css/${id}`, {
        headers,
        data: { doc: { ...doc, contributor }, message: "Move." },
      });
      expect(moved.status()).toBe(400);
    }

    const listed =
      await (await request.get("/api/author/scat-css", { headers }))
        .json();
    expect(listed.items).toEqual([
      expect.objectContaining({ _key: id, organization: own }),
    ]);

    const edited = await request.post(`/api/author/scat-css/${id}`, {
      headers,
      data: { doc: { ...doc, description: "Edited" }, message: "Edit." },
    });
    expect(edited.status()).toBe(200);
  } finally {
    await rootDb().stripAffiliations(userKey);
  }
});

test("the editor shows why a set could not be saved", async ({ page, request }) => {
  const org = "Editor feedback organization";
  const userKey = await joinOrganizations(ADMIN_EMAIL, org);

  try {
    const doc = JSON.parse(
      await readFile(`${seedDir}/dummy.json`, { encoding: "utf8" }),
    );
    doc.contributor = org;
    const headers = bearer();

    for (const name of ["Taken name", "Free name"]) {
      const created = await request.post("/api/author/scat-css", {
        headers,
        data: { doc: { ...doc, name }, message: "Initial upload." },
      });
      expect(created.status()).toBe(200);
    }
    const listed =
      await (await request.get("/api/author/scat-css", { headers })).json();
    const free = listed.items.find(({ name }: { name: string }) =>
      name === "Free name"
    );

    await page.goto(`/author/set/${free._key}/edit`);
    await page.getByLabel("Name *").fill("Taken name");
    await page.getByPlaceholder("Describe which changes have").fill("Rename.");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText("Could not save the set")).toBeVisible();
    await expect(
      page.getByText(
        `A dataset with name Taken name already exists for ${org}.`,
      ),
    ).toBeVisible();
    await expect(page.getByText("Saved set with id")).toHaveCount(0);
  } finally {
    await rootDb().stripAffiliations(userKey);
  }
});

test("the editor refuses a name that another published set already has", async ({ page, request }) => {
  const org = "Editor name organization";
  const userKey = await joinOrganizations(ADMIN_EMAIL, org);

  try {
    const doc = JSON.parse(
      await readFile(`${seedDir}/dummy.json`, { encoding: "utf8" }),
    );
    doc.contributor = org;
    const headers = bearer();

    // Published sets are at version 1, so renaming one creates a draft at
    // version 2, which does not collide with the unique index of the database.
    const keys: Record<string, string> = {};
    for (const name of ["Published name", "Renamed name"]) {
      const created = await request.post("/api/author/scat-css", {
        headers,
        data: { doc: { ...doc, name }, message: "Initial upload." },
      });
      expect(created.status()).toBe(200);
      const { id } = await created.json();
      const published = await request.post(
        `/api/author/scat-css/${id}/publish`,
        { headers },
      );
      expect(published.status()).toBe(200);
      keys[name] = id;
    }

    await page.goto(`/author/set/${keys["Renamed name"]}/edit`);
    await page.getByLabel("Name *").fill("Published name");
    await page.getByPlaceholder("Describe which changes have").fill("Rename.");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText(
        `A dataset with name Published name already exists for ${org}.`,
      ),
    ).toBeVisible();
    await expect(page.getByText("Saved set with id")).toHaveCount(0);

    // The set may keep its own name, although its published version has it.
    await page.getByLabel("Name *").fill("Renamed name");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Saved set with id")).toBeVisible();
  } finally {
    await rootDb().stripAffiliations(userKey);
  }
});
