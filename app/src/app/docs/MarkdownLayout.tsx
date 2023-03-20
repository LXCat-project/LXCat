// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { createStyles } from "@mantine/core";
import { DocFile } from "../../docs/generator";
import { DocsSidebar } from "./DocsSidebar";

const useStyles = createStyles(() => ({
  main: {
    position: "absolute",
    left: 310,
    top: 60,
    bottom: 0,
    right: 0,
    overflowY: "scroll",
  },
}));

export const MarkdownLayout = ({
  docFiles,
  children,
}: {
  docFiles: Array<DocFile>;
  children: React.ReactNode;
}) => {
  const { classes } = useStyles();
  return (
    <>
      <DocsSidebar docFiles={docFiles} />
      <div className={classes.main}>
        {children}
      </div>
    </>
  );
};
