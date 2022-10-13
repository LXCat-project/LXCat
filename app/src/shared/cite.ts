// TODO it would be nice to not load the citation packages on pages where it is not used (for example /scat-css)
// could use https://nextjs.org/docs/advanced-features/dynamic-import
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-csl";

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
