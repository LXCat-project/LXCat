// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "./env.js";
import { db } from "../db.js";

(async () => {
  try {
    const email = process.argv[2];
    await db().makeAdmin(email);
    console.log(`${email} now has all roles, including admin`);
  } catch (err) {
    console.error(err);
  }
})();
