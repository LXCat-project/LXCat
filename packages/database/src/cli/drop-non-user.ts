// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "./env.js";
import { db } from "../db.js";

(async () => {
  try {
    await db().dropNonUserCollections();
  } catch (err) {
    console.error(err);
  }
})();
