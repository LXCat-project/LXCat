import { useMemo } from "react";

import { Reference as ReferenceRecord } from "@lxcat/schema/dist/core/reference";

import { reference2bibliography } from "./cite";

export const Reference = (r: ReferenceRecord) => {
  const bibliography = useMemo(() => {
    return reference2bibliography(r);
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
