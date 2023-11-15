// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { load_css_dir } from "../css/loaders.js";
import { db } from "../db.js";

(async () => {
  const dir = process.argv[2];
  await load_css_dir(db(), dir);
})();
