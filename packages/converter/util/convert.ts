// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from "fs";
import { convertDocument } from "..";

if (process.argv.length !== 3) {
  throw new Error(
    "Expected the path to the JSON file to convert to legacy format as the only argument.",
  );
}

const file = readFileSync(process.argv[2], "utf8");

console.log(convertDocument(JSON.parse(file)));
