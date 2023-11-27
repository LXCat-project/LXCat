// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatDatabase } from "@lxcat/database";

const _db: LXCatDatabase | undefined = undefined;

export function rootDb() {
  if (_db === undefined) {
    return setRootDb(
      process.env.ARANGO_URL!,
      process.env.ARANGO_ROOT_PASSWORD,
      "root",
      process.env.ARANGO_DB,
    );
  }

  return _db;
}

const setRootDb = (
  url: string,
  password: string | undefined,
  username = "root",
  databaseName = "lxcat",
) => LXCatDatabase.init(url, databaseName, username, password);
