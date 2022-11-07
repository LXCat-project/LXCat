// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Cite } from "@citation-js/core";
import { getReferenceLabel } from "./cite";
import "@citation-js/plugin-bibtex";

export async function bibtex2csl(bibtex: string) {
  const cite = await Cite.async(bibtex, {
    forceType: "@bibtex/text",
  });
  const refs = cite.data;
  const labelRefs = Object.fromEntries(
    refs.map((r) => {
      // citation-js stores bookkeeping as _graph prop, we dont need it
      // TODO use removeGraph from https://github.com/citation-js/citation-js/blob/main/packages/core/src/plugins/input/graph.js
      delete (r as any)._graph;
      const label = getReferenceLabel(r);
      return [label, r];
    })
  );
  return labelRefs;
}
