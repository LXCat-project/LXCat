// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatMigrationDocument } from "@lxcat/schema/migration";
import "./env.js";
import jsonpatch from "jsonpatch";
import fs from "node:fs/promises";
import path from "node:path";
import { exit } from "node:process";
import { db } from "../db.js";

const fixTimestamps = (dataset: any) => {
  if (dataset.versionInfo.createdOn.slice(-1) != "Z") {
    dataset.versionInfo.createdOn += "Z";
  }

  for (
    const info of dataset.processes.flatMap((process: any) => process.info)
  ) {
    if (info.versionInfo.createdOn.slice(-1) != "Z") {
      info.versionInfo.createdOn += "Z";
    }
  }

  return dataset;
};

const patchDocument = (document: LXCatMigrationDocument, patch: any) => {
  let data = jsonpatch.apply_patch(document, patch);
  data["processes"] = Object.values(data["processes"]);
  data = fixTimestamps(data);

  const result = LXCatMigrationDocument.safeParse(data);

  if (!result.success) {
    console.log(result.error.issues);
    exit();
  }

  return result.data;
};

(async () => {
  const dir = process.argv[2];

  const v1 = path.join(dir, "v1.json");
  console.log(v1);

  let data = JSON.parse(await fs.readFile(v1, "utf8"));
  data["processes"] = Object.values(data["processes"]);
  data = fixTimestamps(data);

  const result = await LXCatMigrationDocument.safeParseAsync(data);

  if (!result.success) {
    console.log(result.error.issues);
    exit();
  }

  await db().loadHistoricDataset(result.data, "Migrated from LXCat 2.");

  let version = 2;

  while (true) {
    try {
      const patch = JSON.parse(
        await fs.readFile(
          path.join(dir, `v${version}_patch.json`),
          "utf8",
        ),
      );
      data = patchDocument(data, patch);
      await db().loadHistoricDataset(data, "Migrated from LXCat 2.");
    } catch (err) {
      console.log(err);
      break;
    }

    version += 1;
  }
})();
