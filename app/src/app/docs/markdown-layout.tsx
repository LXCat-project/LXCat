// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AppShell, AppShellMain } from "@mantine/core";
import { DocFile } from "../../docs/generator";
import classes from "./docs.module.css";
import { DocsSidebar } from "./sidebar";

export const MarkdownLayout = ({
  docFiles,
  children,
}: {
  docFiles: Array<DocFile>;
  children: React.ReactNode;
}) => {
  return (
    <AppShell>
      <DocsSidebar docFiles={docFiles} />
      <AppShellMain>
        {children}
      </AppShellMain>
      {
        // <div className={classes.main}>
        //   {children}
        // </div>
      }
    </AppShell>
  );
};
