// SPDX-FileCopyrightText: LXCat team

// SPDX-License-Identifier: AGPL-3.0-or-later
import "dotenv/config";
import { dirname, join } from "path";
import { load_css_dir } from "../../src/css/loaders";

export default async function() {
  const thisfile = new URL(import.meta.url);
  const dir = join(dirname(thisfile.pathname), "crosssections");
  await load_css_dir(dir);
}
