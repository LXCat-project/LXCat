// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { DocFile } from "../../docs/generator";
import classes from "./docs.module.css";
import { DocsSidebar } from "./DocsSidebar";

export const MarkdownLayout = ({
  docFiles,
  children,
}: {
  docFiles: Array<DocFile>;
  children: React.ReactNode;
}) => {
  return (
    <>
      <DocsSidebar docFiles={docFiles} />
      <div className={classes.main}>
        {children}
      </div>
    </>
  );
};
