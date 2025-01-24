// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "dotenv/config";
import { Database } from "arangojs";
import { CreateDatabaseOptions } from "arangojs/databases";
import Result, { err, ok } from "true-myth/result";
import { ArangoError } from "../error.js";

export const setupDatabase = async (
  system: Database,
  databaseName: string,
  options?: CreateDatabaseOptions,
): Promise<Result<Database, Error>> => {
  const names = await system.listDatabases();

  if (!names.includes(databaseName)) {
    return ok(await system.createDatabase(databaseName, options));
  } else {
    return err(ArangoError(`Database ${databaseName} already exists`));
  }
};
