// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CrossSectionSetHeading } from "@lxcat/database/set";
import { VersionedLTPDocumentWithReference } from "@lxcat/schema";
import { readFile } from "fs/promises";
import { expect, test } from "playwright-test-coverage";
import { uploadAndPublishDummySet } from "./global-setup";
import { rootDb } from "./root-db";

test.use({ storageState: "adminStorageState.json" });

test.describe("given 2 dummy sets", () => {
  test.beforeAll(async ({ browser }) => {
    await uploadAndPublishDummySet(browser);
    await uploadAndPublishDummySet(
      browser,
      "dummy2.json",
      "Some other organization",
    );
  });

  test.afterAll(async () => {
    await rootDb().truncateNonUserCollections();
  });

  test.describe("periodic table select page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/cs-set");
    });

    test("should list 2 sets when selecting nitrogen", async ({ page }) => {
      await page.getByRole("button", { name: "N Nitrogen" }).click();

      const set1 = page.getByRole("cell", { name: "Some organization" });
      const set2 = page.getByRole("cell", { name: "Some other organization" });
      await expect(set1).toBeVisible();
      await expect(set2).toBeVisible();
    });
  });

  test.describe("cross section set list api route", () => {
    test("given no search params, should list 2 sets", async ({ request }) => {
      const res = await request.get("/api/scat-css");
      const items = await res.json();
      expect(items).toHaveLength(2);
    });
    test("given filter on a org, should list 1 sets", async ({ request }) => {
      const res = await request.get(
        "/api/scat-css?contributor=Some+organization",
      );
      const items = await res.json();
      expect(items).toHaveLength(1);
    });
  });

  test.describe("cross section set detail api route", () => {
    let setId: string;
    test.beforeEach(async ({ request }) => {
      const res = await request.get(
        "/api/scat-css?contributor=Some+organization",
      );
      const body: CrossSectionSetHeading[] = await res.json();
      setId = body[0].id;
    });

    test.describe("/api/scat-css/[id]", () => {
      test("given no refstyle should return csl", async ({ request }) => {
        const res = await request.get(`/api/scat-css/${setId}`);
        const set = VersionedLTPDocumentWithReference.parse(await res.json());
        const ref0 = Object.values(set.references)[0];

        if (typeof ref0 === "string") {
          test.fail(true, "Expected references to be in CSL format.");
        } else {
          expect(ref0.id).toEqual("SomeMainId");
        }
      });

      test("given bibtex refstyle should return bibtex string", async ({ request }) => {
        const res = await request.get(`/api/scat-css/${setId}?refstyle=bibtex`);
        const set = VersionedLTPDocumentWithReference.parse(await res.json());
        const expected = `@article{MyFamilyNameSome,
\tauthor = {MyFamilyName, MyGivenName},
\tjournal = {SomeJournal},
\tdoi = {10.1109/5.771073},
\ttitle = {Some main reference title},
\turl = {https://doi.org/10.1109/5.771073},
\thowpublished = {https://doi.org/10.1109/5.771073},
}

`;
        const ref0 = Object.values(set.references)[0];
        expect(ref0).toEqual(expected);
      });

      test("given apa refstyle should return apa string", async ({ request }) => {
        const res = await request.get(`/api/scat-css/${setId}?refstyle=apa`);
        const set = VersionedLTPDocumentWithReference.parse(await res.json());
        const ref0 = Object.values(set.references)[0];
        const expected =
          "MyFamilyName, M. (n.d.). Some main reference title. In SomeJournal. https://doi.org/10.1109/5.771073\n";
        expect(ref0).toEqual(expected);
      });
    });

    test.describe("/api/scat-css/[id]/legacy", () => {
      test("should return text in bolsig+ format", async ({ request }) => {
        const res = await request.get(`/api/scat-css/${setId}/legacy`);

        expect(res.headers()["content-type"]).toEqual(
          "text/plain;charset=UTF-8, text/plain",
        );
        const body = await res.text();
        expect(body).toBeTruthy();
      });
    });
  });

  test.describe("cross section set details page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/cs-set");

      await page.getByRole("button", { name: "N Nitrogen" }).click();

      await page.getByRole("cell", { name: "Some organization" }).click();
      await page.locator("text=I agree with the terms of use").click();
    });

    test("should have single process listed", async ({ page }) => {
      const processes = page.locator(
        ".mantine-Table-table:has-text(\"Reaction\") tbody tr",
      );
      await expect(processes).toHaveCount(1);
    });

    // TODO: Use set with more than 5 cross sections to test whether only first 5 are checked.
    test("only process plot checkbox should be checked", async ({ page }) => {
      const checkboxes = page.locator("tbody input[type=checkbox]");
      await expect(checkboxes).toBeChecked();
    });

    test("should have plot", async ({ page }) => {
      const canvas = page.locator(".plot-container.plotly");
      await expect(canvas).toBeVisible();
    });

    test("should be able to download SVG", async ({ page }) => {
      test.setTimeout(60000);

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.locator("a[data-title=\"Download plot\"]").click(),
      ]);

      const svgPath = await download.path();
      const svgContent = await readFile(svgPath!, { encoding: "utf8" });
      expect(svgContent).toContain(
        "$\\text{Energy }\\left(\\mathrm{eV}\\right)$",
      );
      // TODO: Check that all cross sections are drawn.
    });

    test.describe("visit details page with termsOfUse search param", () => {
      let urlWithHash = "";
      test.beforeEach(async ({ page }) => {
        await page.locator("text=Download data").click();

        const downloadPromise = page.waitForEvent("download");

        await page
          .locator(".mantine-Menu-itemLabel:has-text('JSON')")
          .click();

        const download = await downloadPromise;

        if (download === null) {
          test.fail();
          return;
        }

        // TODO: Links should point to `/api/scat-css`.
        const path = await download.path();
        const content = JSON.parse(await readFile(path, { encoding: "utf8" }));
        urlWithHash = content.termsOfUse.replace("http://localhost:3000", "");
      });

      test("should show terms of use dialog", async ({ context }) => {
        const page = await context.newPage();
        await page.goto(urlWithHash);
        const acceptButton = page.locator("text=I agree with the terms of use");
        await expect(acceptButton).toBeVisible();
      });
    });
  });
});
