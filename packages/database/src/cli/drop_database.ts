// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { db } from "../db.js";
import { systemDb } from "../systemDb.js";

(async () => {
  try {
    await systemDb().removeUser(process.env.ARANGO_USER!);
    await systemDb().dropDatabase(db().name());
  } catch (err) {
    console.error(err);
  }
})();
