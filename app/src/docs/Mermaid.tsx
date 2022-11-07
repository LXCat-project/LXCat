// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useState } from "react";
import mermaid from "mermaid";

interface Props {
  chart: string;
}

export const Mermaid = ({ chart }: Props) => {
  const [svg, setSvg] = useState("<svg></svg>");
  useEffect(() => {
    mermaid.render("mermaid", chart, (html: string) => {
      setSvg(html);
    });
  }, [chart]);
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
};
