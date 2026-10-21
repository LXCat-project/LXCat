// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatDatabase } from "@lxcat/database";

let _db: LXCatDatabase | undefined = undefined;

export function rootDb() {
  if (_db === undefined) {
    _db = LXCatDatabase.init(
      process.env.ARANGO_URL!,
      process.env.ARANGO_DB,
      "root",
      process.env.ARANGO_ROOT_PASSWORD,
    );
  }

  return _db;
}
