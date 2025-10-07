// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from "playwright-test-coverage";
import { clickUntilVisible, getSeededSet } from "./helpers";

test("a set that is expanded again while it loads is loaded once", async ({ page, request }) => {
  // The selection is the set itself, which is in the URL.
  const { setId } = await getSeededSet(request);
  const template = {
    consumes: [{}],
    produces: [{}],
    typeTags: [],
    reversible: "both",
    set: [setId],
  };
  await page.goto(
    `/data?reactions=${encodeURIComponent(JSON.stringify([template]))}`,
  );

  // The response of the cross sections is held back until the set was
  // expanded again, so that it is still loading.
  const actions: Array<string> = [];
  let release!: () => void;
  const released = new Promise<void>((resolve) => release = resolve);
  await page.route("**/data**", async (route) => {
    if (route.request().headers()["next-action"]) {
      actions.push(route.request().url());
      await released;
    }
    await route.continue();
  });

  const row = page.getByRole("row", { name: /Some organization/ });
  const table = page.getByText("Threshold (eV)");
  await clickUntilVisible(row, table);
  await expect.poll(() => actions.length).toBe(1);

  await row.click();
  await expect(table).toHaveCount(0);
  await row.click();
  await expect(table).toBeVisible();

  release();
  // The nested table is the last one with the thresholds, as the table of the
  // sets contains it.
  const nested = page.locator("table:has(th:has-text(\"Threshold (eV)\"))")
    .last();
  await expect(nested.locator("tbody tr")).toHaveCount(1);
  await page.waitForLoadState("networkidle");
  expect(actions).toHaveLength(1);
});
