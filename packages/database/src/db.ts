// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatDatabase } from "./lxcat-database.js";

let _db: LXCatDatabase | undefined = undefined;

export function db() {
  if (_db === undefined) {
    _db = initDB(
      process.env.ARANGO_URL || "http://localhost:8529",
      process.env.ARANGO_PASSWORD,
      process.env.ARANGO_USERNAME || "lxcat",
      process.env.ARANGO_DB,
    );
  }

  return _db;
}

const initDB = (
  url: string,
  password: string | undefined,
  username = "lxcat",
  databaseName = "lxcat",
) => LXCatDatabase.init(url, databaseName, username, password);
