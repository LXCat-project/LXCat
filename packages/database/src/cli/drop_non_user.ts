// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { db } from "../db.js";

(async () => {
  try {
    await db().dropNonUserCollections();
  } catch (err) {
    console.error(err);
  }
})();
