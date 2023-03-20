// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { CrossSectionSetHeading } from "@lxcat/database/dist/css/public";
import type { CrossSectionSetRaw } from "@lxcat/schema/dist/css/input";
import { expect, test } from "@playwright/test";
import { readFile } from "fs/promises";
import {
  truncateNonUserCollections,
  uploadAndPublishDummySet,
} from "./global-setup";

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
    await truncateNonUserCollections();
  });

  test.describe("cross section set list page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/scat-css");
    });

    test("should list 2 sets", async ({ page }) => {
      const set1 = page.locator("text=Some name");
      const set2 = page.locator("text=Some other name");
      await expect(set1).toBeVisible();
      await expect(set2).toBeVisible();
    });
  });

  test.describe("cross section set list api route", () => {
    test("given no search params, should list 2 sets", async ({ request }) => {
      const res = await request.get("/api/scat-css");
      const { items } = await res.json();
      expect(items).toHaveLength(2);
    });
    test("given filter on a org, should list 1 sets", async ({ request }) => {
      const res = await request.get(
        "/api/scat-css?contributor=Some+organization",
      );
      const { items } = await res.json();
      expect(items).toHaveLength(1);
    });
  });

  test.describe("cross section set detail api route", () => {
    let setId: string;
    test.beforeEach(async ({ request }) => {
      const res = await request.get(
        "/api/scat-css?contributor=Some+organization",
      );
      const body: { items: CrossSectionSetHeading[] } = await res.json();
      setId = body.items[0].id;
    });

    test.describe("/api/scat-css/[id]", () => {
      test("given no refstyle should return csl", async ({ request }) => {
        const res = await request.get(`/api/scat-css/${setId}`);
        const set: CrossSectionSetRaw = await res.json();
        const ref0 = Object.values(set.references)[0];
        expect(ref0.id).toEqual("SomeMainId");
      });

      test("given bibtex refstyle should return bibtex string", async ({ request }) => {
        const res = await request.get(`/api/scat-css/${setId}?refstyle=bibtex`);
        const set: CrossSectionSetRaw = await res.json();
        const expected = `@article{MyFamilyNameSome,
\tauthor = {MyFamilyName, MyGivenName},
\tjournal = {SomeJournal},
\ttitle = {Some main reference title},
\thowpublished = {https://doi.org/10.1109/5.771073},
}

`;
        const ref0 = Object.values(set.references)[0];
        expect(ref0).toEqual(expected);
      });

      test("given apa refstyle should return apa string", async ({ request }) => {
        const res = await request.get(`/api/scat-css/${setId}?refstyle=apa`);
        const set: CrossSectionSetRaw = await res.json();
        const ref0 = Object.values(set.references)[0];
        const expected =
          "MyFamilyName, M. (n.d.). Some main reference title. In SomeJournal. https://doi.org/10.1109/5.771073\n";
        expect(ref0).toEqual(expected);
      });
    });

    test.describe("/api/scat-css/[id]/legacy", () => {
      test("should return text in bolsig+ format", async ({ request }) => {
        const res = await request.get(`/api/scat-css/${setId}/legacy`);

        expect(res.headers()["content-type"]).toEqual("text/plain");
        const body = await res.text();
        expect(body).toBeTruthy();
      });
    });
  });

  test.describe("cross section set details page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/scat-css");
      await page.locator("text=Some name").click();
      await page.locator("text=I agree with the terms of use").click();
      await page.waitForSelector("h2:has-text(\"Processes\")");
    });

    test("should have single process listed", async ({ page }) => {
      const processes = page.locator(".proceses-list li");
      await expect(processes).toHaveCount(1);
    });

    test("should have first 5 process plot checkboxes checked", async ({ page }) => {
      const checkboxes = page.locator("input[type=checkbox]");
      await expect(checkboxes).toBeChecked();
      // TODO use set with more than 4 sections, as test set only has 1 section, which make testing toggling hard
    });

    test("should have plot", async ({ page }) => {
      const canvas = page.locator(".chart-wrapper");
      await expect(canvas).toBeVisible();
    });

    test("should be able to download SVG", async ({ page }) => {
      test.setTimeout(60000);

      // Open the vega action context menu aka ... icon
      const details = page
        .locator("details[title=\"Click to view actions\"]");

      await details.locator("summary").click();

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        details.locator("text=Save as SVG").click(),
      ]);

      const svgPath = await download.path();
      const svgContent = await readFile(svgPath!, { encoding: "utf8" });
      expect(svgContent).toContain("Energy (eV)");
      // TODO check multiple sections are drawn
    });

    test.describe("when all checkboxes are unchecked", () => {
      test.beforeEach(async ({ page }) => {
        page.locator("input[type=checkbox]").uncheck();
      });

      test("should show no plot", async ({ page }) => {
        await expect(
          page.locator(
            "text=Nothing to plot, because zero cross sections are selected",
          ),
        ).toBeVisible();
      });
    });

    test.describe("visit details page with #terms_of_use hash", () => {
      let urlWithHash = "";
      test.beforeEach(async ({ page }) => {
        const download = await page
          .locator("text=Download JSON format")
          .getAttribute("href");
        if (download === null) {
          test.fail();
          return;
        }
        const id = download.replace("/api/scat-css/", "");
        urlWithHash = `/scat-css/${id}#terms_of_use`;
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
