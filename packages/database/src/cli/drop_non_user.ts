// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { db } from "../db";

(async () => {
  try {
    await db().truncateNonUserCollections();
  } catch (err) {
    console.error(err);
  }
})();
