// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "./env.js";
import { exit } from "process";
import { LXCatDatabase } from "../lxcat-database.js";
import { systemDb } from "../system-db.js";

const dbName = process.env.ARANGO_DB ?? "lxcat";

const db = await LXCatDatabase.create(systemDb(), dbName);

if (db.isErr) {
  console.log(db.error.message);
  exit();
}

console.log(`Created ${dbName} database.`);

await db.value.createUser(
  systemDb(),
  process.env.ARANGO_USERNAME ?? "lxcat",
  process.env.ARANGO_PASSWORD!,
);
