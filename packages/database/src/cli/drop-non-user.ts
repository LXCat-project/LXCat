// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "./env.js";
import { LXCatDatabase } from "../lxcat-database.js";

(async () => {
  try {
    await LXCatDatabase.init(
      process.env.ARANGO_URL!,
      process.env.ARANGO_DB,
      "root",
      process.env.ARANGO_ROOT_PASSWORD,
    ).dropNonUserCollections();
  } catch (err) {
    console.error(err);
  }
})();
