// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { NewLTPDocument } from "@lxcat/schema";
import { readFile } from "fs/promises";
import { expect, test } from "playwright-test-coverage";
import { seedDir } from "./global-setup";
import { selectConsumed } from "./helpers";
import { rootDb } from "./root-db";

const ORGANIZATION = "Large set organization";
const CROSS_SECTIONS = 45;

test.afterAll(async () => {
  await rootDb().truncateNonUserCollections();
});

test("the cross sections of a set with many cross sections are paged", async ({ page }) => {
  // A published set that has more cross sections than fit on a page. The
  // threshold tells them apart, and is the order in which they are listed.
  const dummy = JSON.parse(
    await readFile(`${seedDir}/dummy.json`, { encoding: "utf8" }),
  );
  const [process] = dummy.processes;
  const doc = NewLTPDocument.parse({
    ...dummy,
    name: "Large set",
    contributor: ORGANIZATION,
    processes: Array.from({ length: CROSS_SECTIONS }, (_, i) => ({
      ...process,
      info: [{ ...process.info[0], threshold: i + 1 }],
    })),
  });
  await rootDb().upsertOrganization(ORGANIZATION);
  await rootDb().createSet(doc);

  await page.goto("/data");
  await selectConsumed(page, "\\mathrm{N_{2}}");

  const row = page.getByRole("row", { name: /Large set/ });
  await expect(row).toContainText(String(CROSS_SECTIONS));
  await row.click();

  // The nested table is the last one with the thresholds, as the table of the
  // sets contains it.
  const nested = page.locator("table:has(th:has-text(\"Threshold (eV)\"))")
    .last();
  const thresholds = () => nested.locator("tbody tr td:nth-child(2)");
  await expect(page.getByText("1–20 of 45")).toBeVisible();
  await expect(thresholds()).toHaveText(
    Array.from({ length: 20 }, (_, i) => String(i + 1)),
  );

  await page.getByRole("button", { name: "3", exact: true }).click();
  await expect(page.getByText("41–45 of 45")).toBeVisible();
  await expect(thresholds()).toHaveText(["41", "42", "43", "44", "45"]);

  // The page that was shown stays the page of the set.
  await page.getByRole("button", { name: "2", exact: true }).click();
  await expect(thresholds().first()).toHaveText("21");
});
