// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { makeAdmin } from "../auth/queries";

(async () => {
  try {
    const email = process.argv[2];
    await makeAdmin(email);
    console.log(`${email} now has all roles, including admin`);
  } catch (err) {
    console.error(err);
  }
})();
