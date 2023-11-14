// SPDX-FileCopyrightText: LXCat team

// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { dirname, join } from "path";
import { load_css_dir } from "../../css/loaders.js";
import { LXCatDatabase } from "../../lxcat-database.js";

export default async function(db: LXCatDatabase) {
  const thisfile = new URL(import.meta.url);
  const dir = join(dirname(thisfile.pathname), "crosssections");
  await load_css_dir(db, dir);
}
