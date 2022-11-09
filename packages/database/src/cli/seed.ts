// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { readdir } from "fs/promises";
import path from "path";

(async () => {
  const dir = process.argv[2];
  const files = await readdir(dir);
  for (const file of files) {
    const afile = path.resolve(dir, file);
    if (afile.endsWith(".ts")) {
      const module = await import(afile);
      await module.default();
    }
  }
})();
