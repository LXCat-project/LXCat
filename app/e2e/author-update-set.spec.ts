// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readFile } from "fs/promises";
import { expect, test } from "playwright-test-coverage";
import { bearer } from "./api-tokens";
import { ADMIN_EMAIL, seedDir } from "./global-setup";
import { joinOrganizations, rootDb } from "./root-db";

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

    const created = await request.post("/api/author/set", {
      headers,
      data: { doc, message: "Initial upload." },
    });
    expect(created.status()).toBe(200);
    const { id } = await created.json();

    // Both an organization of the user and one they are not a member of.
    for (const contributor of [sibling, foreign]) {
      const moved = await request.post(`/api/author/set/${id}`, {
        headers,
        data: { doc: { ...doc, contributor }, message: "Move." },
      });
      expect(moved.status()).toBe(400);
    }

    const listed = await (await request.get("/api/author/set", { headers }))
      .json();
    expect(listed.items).toEqual([
      expect.objectContaining({ _key: id, organization: own }),
    ]);

    const edited = await request.post(`/api/author/set/${id}`, {
      headers,
      data: { doc: { ...doc, description: "Edited" }, message: "Edit." },
    });
    expect(edited.status()).toBe(200);
  } finally {
    await rootDb().stripAffiliations(userKey);
  }
});
