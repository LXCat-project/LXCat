// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { db } from "../db";
import { systemDb } from "../systemDb";

(async () => {
  try {
    await systemDb().dropDatabase(db().name);
  } catch (err) {
    console.error(err);
  }
})();
