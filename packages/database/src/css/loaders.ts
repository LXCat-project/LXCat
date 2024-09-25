// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Contributor, NewLTPDocument } from "@lxcat/schema";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { LXCatDatabase } from "../lxcat-database.js";

async function load_css(db: LXCatDatabase, fn: string) {
  const content = await readFile(fn, { encoding: "utf8" });
  const body = NewLTPDocument.parse(JSON.parse(content));
  const id = await db.createSet(body);
  console.log(`Inserted ${fn} as ${id} into CrossSectionSet collection`);
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

const load_organization_from_file = async (db: LXCatDatabase, path: string) => {
  const content = await readFile(path, { encoding: "utf8" });
  const org = Contributor.parse(JSON.parse(content));
  const orgId = await db.addOrganization(org);
  console.log(`Inserted organization ${org.name} with key ${orgId}.`);
};

export const load_organizations_from_file = async (
  db: LXCatDatabase,
  path: string,
) => {
  const content = await readFile(path, { encoding: "utf8" });
  const orgs = Contributor.array().parse(JSON.parse(content));
  for (const org of orgs) {
    const orgId = await db.addOrganization(org);
    console.log(`Inserted organization ${org.name} with key ${orgId}.`);
  }
};

export const load_organizations_dir = async (
  db: LXCatDatabase,
  dir: string,
) => {
  const files = await readdir(dir);
  for (const file of files) {
    if (file.endsWith(".json")) {
      await load_organization_from_file(db, join(dir, file));
    }
  }
};
