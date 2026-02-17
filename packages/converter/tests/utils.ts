// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import assert from "assert";
import { it as test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

const { convertDocument } = require("..");

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
