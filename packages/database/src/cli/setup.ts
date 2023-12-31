// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "./env.js";
import { LXCatDatabase } from "../lxcat-database.js";
import { systemDb } from "../systemDb.js";

const db = await LXCatDatabase.create(
  systemDb(),
  process.env.ARANGO_DB ?? "lxcat",
);
await db.createUser(
  systemDb(),
  process.env.ARANGO_USERNAME ?? "lxcat",
  process.env.ARANGO_PASSWORD!,
);
