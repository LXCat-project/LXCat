// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { db } from "..";
import { load_css_dir } from "../css/loaders";

(async () => {
  const dir = process.argv[2];
  await load_css_dir(db(), dir);
})();
