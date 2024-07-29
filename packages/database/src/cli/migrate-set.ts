// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatMigrationDocument } from "@lxcat/schema/migration";
import "./env.js";
import fs from "node:fs/promises";
import path from "node:path";
import { exit } from "node:process";
import { db } from "../db.js";

const fixTimestamps = (dataset: any) => {
  dataset.versionInfo.createdOn += "Z";

  for (
    const info of dataset.processes.flatMap((process: any) => process.info)
  ) {
    info.versionInfo.createdOn += "Z";
  }

  return dataset;
};

(async () => {
  const dir = process.argv[2];

  const v1 = path.join(dir, "v1.json");
  console.log(v1);

  await fs.access(v1);

  let data = JSON.parse(await fs.readFile(v1, "utf8"));
  data["processes"] = Object.values(data["processes"]);
  data = fixTimestamps(data);

  const result = await LXCatMigrationDocument.safeParseAsync(data);

  if (!result.success) {
    console.log(result.error.issues);
    exit();
  }

  db().loadHistoricDataset(result.data, "Migrated from LXCat 2.");
})();
