// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Database } from "arangojs";

let _db: Database | undefined = undefined;

export function systemDb() {
  if (_db === undefined) {
    return setSystemDb(
      process.env.ARANGO_URL || "http://localhost:8529",
      process.env.ARANGO_ROOT_PASSWORD,
    );
  }

  return _db;
}

export const setSystemDb = (
  url: string,
  password: string | undefined,
) => {
  _db = new Database({
    url,
    auth: {
      username: "root",
      password,
    },
  });
  return _db;
};
