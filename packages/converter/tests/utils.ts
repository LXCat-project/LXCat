// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import assert from "assert";
import { join } from "node:path";
import { it as test } from "node:test";
import { convertDocument } from "@lxcat/converter";
import { readFileSync } from "fs";

export function it(name: string, basePath: string) {
  return test(name, () => {
    convertAssert(join(basePath, name));
  });
}

export function convertAssert(path: string) {
  const document = JSON.parse(readFileSync(join(path, "in.json"), "utf8"));
  const truth = readFileSync(join(path, "out.txt"), "utf8");

  assert.strictEqual(convertDocument(document), truth.slice(0, -1));
}
