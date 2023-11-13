// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { LXCatDatabase } from "../lxcat-database";
import { PartialKeyedDocument } from "../schema/document";

export async function load_css(db: LXCatDatabase, fn: string) {
  const content = await readFile(fn, { encoding: "utf8" });
  const body = PartialKeyedDocument.parse(JSON.parse(content));
  const cs_set_id = await db.createSet(body);
  console.log(`Inserted ${fn} as ${cs_set_id} into CrossSectionSet collection`);
}

export async function load_css_dir(db: LXCatDatabase, dir: string) {
  const files = await readdir(dir);
  for (const file of files) {
    const afile = join(dir, file);
    if (afile.endsWith(".json")) {
      await load_css(db, afile);
    }
  }
}
