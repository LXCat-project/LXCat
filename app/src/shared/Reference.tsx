// TODO replace with @citation-js/core + @citation-js/core + ... for smaller bundle because those are treeshakeable
import Cite from "citation-js";
import { Reference as ReferenceRecord } from "@lxcat/schema/dist/core/reference";
import { useMemo } from "react";

export function ref2bibliography(r: ReferenceRecord, template = 'apa'): string {
  const cite = new Cite(r, {
    forceType: "@csl/object",
  });
  // Format CSL into APA style bibliography
  const bib =  cite.format("bibliography", {
    format: "text",
    template,
  });
  if (typeof bib === 'object') {
    return Object.values(bib)[0]
  }
  return bib
}

export const Reference = (r: ReferenceRecord) => {
  const bibliography = useMemo(() => {
    return ref2bibliography(r)
  }, [r]);
  return (
    <cite>
      {r.URL ? (
        <a href={r.URL} target="_blank" rel="noreferrer">
          {bibliography}
        </a>
      ) : (
        bibliography
      )}
    </cite>
  );
};
