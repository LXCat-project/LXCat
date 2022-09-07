// TODO replace with @citation-js/core + @citation-js/core + ... for smaller bundle because those are treeshakeable
import Cite from "citation-js";
import { Reference as ReferenceRecord } from "@lxcat/schema/dist/core/reference";
import { useMemo } from "react";

export const Reference = (r: ReferenceRecord) => {
  const bibliography = useMemo(() => {
    const cite = new Cite(r, {
      forceType: "@csl/object",
    });
    // Format CSL into APA style bibliography
    return cite.format("bibliography", {
      format: "text",
      template: "apa",
    });
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
