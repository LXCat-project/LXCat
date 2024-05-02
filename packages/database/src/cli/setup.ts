// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "./env.js";
import { exit } from "process";
import { LXCatDatabase } from "../lxcat-database.js";
import { systemDb } from "../system-db.js";

const dbName = process.env.ARANGO_DB ?? "lxcat";
const username = process.env.ARANGO_USERNAME ?? "lxcat";
const password = process.env.ARANGO_PASSWORD!;

const db = await LXCatDatabase.create(systemDb(), dbName);

if (db.isErr) {
  console.log(db.error.message);
  exit();
}

console.log(`Created ${dbName} database.`);

// Create the `lxcat` user if it doesn't already exist.
if (!(await systemDb().listUsers()).find((user) => user.user === username)) {
  await db.value.createUser(systemDb(), username, password);
}
