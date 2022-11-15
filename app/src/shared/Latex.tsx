// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "katex/dist/katex.min.css";
import { Math } from "@lxcat/react-math/dist";
import { Box, DefaultProps } from "@mantine/core";

export type LatexProps = DefaultProps & { children: string };

export const Latex = ({ children, ...props }: LatexProps) => (
  <Box {...props}>
    <Math latex={children} />
  </Box>
);
