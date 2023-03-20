// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Database } from "arangojs";

let _db: Database | undefined = undefined;

export function systemDb() {
  if (_db === undefined) {
    // Do not use `db` from app as it will error trying to connect to non-existing db
    return setSystemDb(
      process.env.ARANGO_URL || "http://localhost:8529",
      process.env.ARANGO_PASSWORD,
      process.env.ARANGO_USERNAME || "root",
    );
  }

  return _db;
}

export const setSystemDb = (
  url: string,
  password: string | undefined,
  username = "root",
) => {
  _db = new Database({
    url,
    auth: {
      username,
      password,
    },
  });
  return _db;
};
