// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { LatexText } from "@/shared/latex";
import Link from "next/link";
import { FormattedReference } from "./formatted-reference";

export const FormattedReferenceLink = ({
  children: { ref, url },
}: {
  children: FormattedReference;
}) =>
  url
    ? (
      <Link href={url} target="_blank">
        <LatexText>{ref}</LatexText>
      </Link>
    )
    : <LatexText>{ref}</LatexText>;
