// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Cite } from "@citation-js/core";
import { getReferenceLabel } from "./cite";
import "@citation-js/plugin-bibtex";

export async function bibtex2csl(bibtex: string) {
  const cite = await Cite.async(bibtex, {
    forceType: "@bibtex/text",
    generateGraph: false,
  });
  const refs = cite.get({ format: "real", type: "json", style: "csl" });
  const labelRefs = Object.fromEntries(
    refs.map((r) => {
      const label = getReferenceLabel(r);
      return [label, r];
    })
  );
  return labelRefs;
}
