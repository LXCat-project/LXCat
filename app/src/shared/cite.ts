// TODO replace with @citation-js/core + @citation-js/plugin-csl + ... for smaller bundle because those are treeshakeable
import {Cite} from '@citation-js/core'
import '@citation-js/plugin-csl'

import { Reference as ReferenceRecord } from "@lxcat/schema/dist/core/reference";

export function reference2bibliography(
  r: ReferenceRecord,
  template = "apa"
): string {
  const cite = new Cite(r, {
    forceType: "@csl/object",
  });
  // Format CSL into APA style bibliography
  const bib = cite.format("bibliography", {
    format: "text",
    template,
  });
  if (typeof bib === "object") {
    return Object.values(bib)[0];
  }
  return bib;
}

export const getReferenceLabel = (r: ReferenceRecord) => {
  const cite = new Cite(r, {
    forceType: "@csl/object",
  });
  const labels = cite.format("label");
  if (typeof labels === "string") {
    return labels;
  }
  return Object.values(labels)[0];
};
