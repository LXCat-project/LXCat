import Cite from "citation-js";
import { Reference as ReferenceRecord } from "./types/reference";

export const Reference = (r: ReferenceRecord) => {
  if ("string" in r) {
    return <cite>{r}</cite>;
  }
  const cite = new Cite(r);
  // Format CSL into APA style bibliography
  const bibliography = cite.format("bibliography");
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
