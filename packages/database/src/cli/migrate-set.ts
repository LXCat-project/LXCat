// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatMigrationDocument } from "@lxcat/schema/migration";
import "./env.js";
import jsonpatch from "jsonpatch";
import fs from "node:fs/promises";
import path from "node:path";
import { exit } from "node:process";
import { Result } from "true-myth";
import { err, ok } from "true-myth/result";
import { deepClone } from "../css/queries/deep-clone.js";
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

const patchDocument = (document: any) => {
  let data = deepClone(document);
  data["processes"] = Object.values(data["processes"]);
  data = fixTimestamps(data);

  const result = LXCatMigrationDocument.safeParse(data);

  if (!result.success) {
    console.log(result.error.issues);
    exit();
  }

  return result.data;
};

const readJSONFile = async (
  path: string,
): Promise<Result<any, unknown>> => {
  try {
    const raw = await fs.readFile(path, "utf8");
    return ok(JSON.parse(raw));
  } catch (e) {
    return err(e);
  }
};

(async () => {
  const dir = process.argv[2];

  const v1 = path.join(dir, "v1.json");
  console.log(v1);

  let curRaw = JSON.parse(await fs.readFile(v1, "utf8"));
  let data = patchDocument(curRaw);

  const result = await LXCatMigrationDocument.safeParseAsync(data);

  if (!result.success) {
    console.log(result.error.issues);
    exit();
  }

  const itemKeyDict: Record<string, string> = {};

  let setKey = await db().loadHistoricDataset(
    result.data,
    "Migrated from LXCat 2.",
    itemKeyDict,
  );

  let version = 2;

  while (true) {
    const patch = await readJSONFile(path.join(dir, `v${version}_patch.json`));
    if (patch.isErr) break;

    curRaw = jsonpatch.apply_patch(curRaw, patch.value);

    const manualPatch = await readJSONFile(
      path.join(dir, `v${version}_manual_patch.json`),
    );
    if (manualPatch.isErr) throw manualPatch.error;

    curRaw = jsonpatch.apply_patch(curRaw, manualPatch.value);

    data = patchDocument(curRaw);
    setKey = await db().createHistoricDraftSet(
      data,
      "Migrated from LXCat 2.",
      setKey,
      itemKeyDict,
    );
    await db().publishSet(setKey);
    console.log(`Loaded version ${version}.`);

    version += 1;
  }
})();
