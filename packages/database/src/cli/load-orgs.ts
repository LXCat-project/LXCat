// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "./env.js";
import { load_organizations_from_file } from "../css/loaders.js";
import { db } from "../db.js";

(async () => {
  const dir = process.argv[2];
  await load_organizations_from_file(db(), dir);
})();
