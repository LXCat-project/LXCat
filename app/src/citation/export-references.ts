// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-ris";
import { db } from "@lxcat/database";
import { Reference } from "@lxcat/schema";

export type ReferenceFormat = "bibtex" | "csl-json" | "ris";

/**
 * Collect the references of the selected cross sections, preceded by a
 * reference to the selection itself.
 */
export async function getReferencesForSelection(
  ids: Array<string>,
): Promise<Array<Reference>> {
  const uniqueIds = [...new Set(ids)];
  const bibliography = await db().getReferencesForSelection(uniqueIds);

  const selectionReference: Reference = {
    id: `LXCatData`,
    type: "dataset",
    title: "Data downloaded from the LXCat platform.",
    URL: `${process.env.NEXT_PUBLIC_URL}/data/inspect?ids=${
      uniqueIds.join(",")
    }`,
  };

  return [selectionReference, ...Object.values(bibliography.references)];
}

/** Serialize references to a string in the requested format. */
export function formatReferences(
  format: ReferenceFormat,
  references: Array<Reference>,
): string {
  if (format === "csl-json") {
    return JSON.stringify(references);
  }
  const formatted = new Cite(references).format(format);
  return typeof formatted === "string" ? formatted : JSON.stringify(formatted);
}
