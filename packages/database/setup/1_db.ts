// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { systemDb } from "../src/systemDb";

export default async function () {
  const db = systemDb();

  const names = await db.listDatabases();
  const databaseName = process.env.ARANGO_NAME || "lxcat";
  if (!names.includes(databaseName)) {
    // TODO only print log when not testing aka calling from cli
    console.log(`Creating database ${databaseName}`);
    await db.createDatabase(databaseName);
  } else {
    console.log("Database already exists");
  }
}
