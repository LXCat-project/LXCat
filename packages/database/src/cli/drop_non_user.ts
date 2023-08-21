// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { db } from "../db";

export async function truncateNonUserCollections() {
  const collections = await db().collections(true);
  for (const c of collections) {
    console.log(`Truncating ${c.name}`);
    if (c.name !== "users") {
      // await c.truncate();
      await c.drop();
    }
  }
}

(async () => {
  try {
    await truncateNonUserCollections();
  } catch (err) {
    console.error(err);
  }
})();
