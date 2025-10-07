// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "server-only";

import { Reference } from "@lxcat/schema";

// TODO it would be nice to not load the citation packages on pages where it is not used (for example /set)
// could use https://nextjs.org/docs/advanced-features/dynamic-import
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-csl";

import { FormattedReference } from "./types";

export const formatReference = (
  id: string,
  r: Reference,
): FormattedReference => (
  {
    id,
    ref: reference2bibliography(r),
    url: r.URL,
  }
);

function reference2bibliography(r: Reference, template = "apa"): string {
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

const getReferenceLabel = (r: Reference) => {
  const cite = new Cite(r, {
    forceType: "@csl/object",
  });
  const labels = cite.format("label");
  if (typeof labels === "string") {
    return labels;
  }
  return Object.values(labels)[0];
};
