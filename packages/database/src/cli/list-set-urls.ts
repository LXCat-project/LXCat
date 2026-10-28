// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { parseArgs } from "node:util";
import "./env.js";
import { db } from "../db.js";

const usage = "Usage: bun list-set-urls [--align|-a] <base-url> <organization>";

function parseCli() {
  try {
    return parseArgs({
      args: process.argv.slice(2),
      options: { align: { type: "boolean", short: "a" } },
      allowPositionals: true,
    });
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    console.error(usage);
    process.exit(1);
  }
}

(async () => {
  const args = parseCli();
  const [baseArg, organization] = args.positionals;
  if (!baseArg || !organization) {
    console.error(usage);
    process.exit(1);
  }

  let base: string;
  try {
    base = new URL(baseArg).href.replace(/\/+$/, "");
  } catch {
    console.error(`Invalid base URL "${baseArg}".`);
    process.exit(1);
  }

  try {
    if (await db().getOrganizationByName(organization) === undefined) {
      console.error(`Organization "${organization}" does not exist.`);
      process.exit(1);
    }

    const sets = await db().listSets(organization);
    sets.sort((a, b) => a.name.localeCompare(b.name));
    const width = Math.max(0, ...sets.map((set) => set.name.length));
    for (const set of sets) {
      const name = args.values.align
        ? `${set.name.padEnd(width)}  `
        : `${set.name}\t`;
      console.log(`${name}${base}/scat-css/${set.id}`);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
