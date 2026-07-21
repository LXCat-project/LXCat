// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useEffect, useState } from "react";

import "katex/dist/katex.min.css";
import { Reference as ReferenceRecord } from "@lxcat/schema";
import Latex from "react-latex-next";

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
            <Latex>{bibliography}</Latex>
          </a>
        )
        : <Latex>{bibliography}</Latex>}
    </cite>
  );
};
