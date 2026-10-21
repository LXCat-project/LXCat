// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Ids of a published set and of its cross sections, as seeded by global setup.
 *
 * Use these to navigate with `page.goto` instead of clicking through the
 * periodic table and the tables to get to a page, unless that navigation is
 * what is being tested.
 */
export async function getSeededSet(
  request: APIRequestContext,
  contributor = "Some organization",
) {
  const list = await request.get(
    `/api/scat-css?contributor=${encodeURIComponent(contributor)}`,
  );
  expect(list.ok()).toBeTruthy();
  const [{ id: setId }] = await list.json() as Array<{ id: string }>;

  const set = await request.get(`/api/scat-css/${setId}`);
  expect(set.ok()).toBeTruthy();
  const doc = await set.json() as {
    processes: Array<{ info: Array<{ _key: string }> }>;
  };
  const itemIds = doc.processes.flatMap(({ info }) => info.map((i) => i._key));

  return { setId, itemIds };
}
