// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { Cite } from "@citation-js/core";
import "@citation-js/plugin-csl";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-doi";

import { Reference } from "@lxcat/schema";

function isReference(obj: unknown): obj is Reference {
  return (
    typeof obj === "object"
    && obj !== null
    && ("type" in obj || "id" in obj || "title" in obj || "author" in obj)
  );
}

function formatReferenceSingle(
  r: Reference,
  template = "apa",
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

function getReferenceLabelSingle(r: Reference): string {
  const cite = new Cite(r, {
    forceType: "@csl/object",
  });
  const labels = cite.format("label");
  if (typeof labels === "string") {
    return labels;
  }
  return Object.values(labels)[0];
}

export async function formatReference(
  r: Reference,
  template?: string,
): Promise<string>;
export async function formatReference(
  r: Array<Reference>,
  template?: string,
): Promise<Array<string>>;
export async function formatReference<K extends string>(
  r: Record<K, Reference>,
  template?: string,
): Promise<Record<K, string>>;
export async function formatReference(
  r: Reference | Array<Reference> | Record<string, Reference>,
  template = "apa",
): Promise<string | Array<string> | Record<string, string>> {
  if (Array.isArray(r)) {
    return Promise.all(
      r.map((ref) => Promise.resolve(formatReferenceSingle(ref, template))),
    );
  }
  if (isReference(r)) {
    return formatReferenceSingle(r, template);
  }
  if (typeof r === "object" && r !== null) {
    const entries = Object.entries(r as Record<string, Reference>);
    const formattedEntries = await Promise.all(
      entries.map(async ([key, ref]) =>
        [key, formatReferenceSingle(ref, template)] as const
      ),
    );
    return Object.fromEntries(formattedEntries);
  }
  return formatReferenceSingle(r as Reference, template);
}

export async function getReferenceLabel(
  r: Reference,
): Promise<string>;
export async function getReferenceLabel(
  r: Array<Reference>,
): Promise<Array<string>>;
export async function getReferenceLabel<K extends string>(
  r: Record<K, Reference>,
): Promise<Record<K, string>>;
export async function getReferenceLabel(
  r: Reference | Array<Reference> | Record<string, Reference>,
): Promise<string | Array<string> | Record<string, string>> {
  if (Array.isArray(r)) {
    return Promise.all(
      r.map((ref) => Promise.resolve(getReferenceLabelSingle(ref))),
    );
  }
  if (isReference(r)) {
    return getReferenceLabelSingle(r);
  }
  if (typeof r === "object" && r !== null) {
    const entries = Object.entries(r as Record<string, Reference>);
    const formattedEntries = await Promise.all(
      entries.map(async ([key, ref]) =>
        [key, getReferenceLabelSingle(ref)] as const
      ),
    );
    return Object.fromEntries(formattedEntries);
  }
  return getReferenceLabelSingle(r as Reference);
}

export async function getReferenceFromDOI(doi: string): Promise<Reference> {
  const cite = await Cite.async(doi, {
    forceType: "@doi/id",
    generateGraph: false,
  });
  const ref = cite.get({ format: "real", type: "json", style: "csl" })[0];
  ref.author?.forEach((author: any) => delete author["affiliation"]);
  return ref;
}

export async function getReferenceFromBibTeX(
  bibtex: string,
): Promise<Record<string, Reference>> {
  const cite = await Cite.async(bibtex, {
    forceType: "@bibtex/text",
    generateGraph: false,
  });
  const refs: Array<Reference> = cite.get({
    format: "real",
    type: "json",
    style: "csl",
  });
  const labelRefs = Object.fromEntries(
    refs.map((r) => {
      const label = getReferenceLabelSingle(r);
      return [label, r];
    }),
  );
  return labelRefs;
}
