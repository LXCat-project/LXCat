// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "katex/dist/katex.min.css";
import { Box, BoxComponentProps } from "@mantine/core";
import ReactLatex from "react-latex-next";

export type LatexProps = BoxComponentProps & { children: string };

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
