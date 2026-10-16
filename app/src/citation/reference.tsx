// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useEffect, useState } from "react";

import { LatexText } from "@/shared/latex";
import { Reference as ReferenceRecord } from "@lxcat/schema";

import { formatReference } from "./cite";

export const Reference = (r: ReferenceRecord) => {
  const [bibliography, setBibliography] = useState<string>("");

  useEffect(() => {
    let active = true;
    formatReference(r).then((bib) => {
      if (active) {
        setBibliography(bib);
      }
    });
    return () => {
      active = false;
    };
  }, [r]);

  return (
    <cite>
      {r.URL
        ? (
          <a href={r.URL} target="_blank" rel="noreferrer">
            <LatexText>{bibliography}</LatexText>
          </a>
        )
        : <LatexText>{bibliography}</LatexText>}
    </cite>
  );
};
