// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "katex/dist/katex.min.css";
import ReactLatex from "react-latex-next";
import { Box, DefaultProps } from "@mantine/core";

export type LatexProps = DefaultProps & { children: string };

export const Latex = ({ children, ...props }: LatexProps) => {
  if (children === "") {
    return <></>;
  }
  return (
    <Box {...props}>
      {/* In the app we use pure latex strings so we surround it with '$' as the react-latex-next component expects it latex fragment */}
      <ReactLatex>{`$${children}$`}</ReactLatex>
    </Box>
  );
};
