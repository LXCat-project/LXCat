// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import Link from "next/link";
import "katex/dist/katex.min.css";
import Latex from "react-latex-next";
import { FormattedReference } from "./types";

export const Reference = ({
  children: { ref, url },
}: {
  children: FormattedReference;
}) =>
  url
    ? (
      <Link href={url} target="_blank">
        <Latex>{ref}</Latex>
      </Link>
    )
    : <Latex>{ref}</Latex>;
