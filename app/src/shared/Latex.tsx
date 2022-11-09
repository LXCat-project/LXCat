// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "katex/dist/katex.min.css";

// @ts-ignore
import { InlineMath } from "react-katex";

export interface LatexProps {
  children: string;
}

export const Latex = ({ children }: LatexProps) => (
  <InlineMath>{children}</InlineMath>
);
