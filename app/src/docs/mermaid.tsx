// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import mermaid from "mermaid";
import { useEffect, useState } from "react";

export type MermaidProps = {
  chart: string;
};

export const Mermaid = ({ chart }: MermaidProps) => {
  const [svg, setSvg] = useState("<svg></svg>");
  useEffect(() => {
    mermaid.render("mermaid", chart).then(({ svg }) => setSvg(svg));
  }, [chart]);
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
};
