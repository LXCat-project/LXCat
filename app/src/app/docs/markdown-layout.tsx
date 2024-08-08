// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AppShell, AppShellMain } from "@mantine/core";
import { DocFile } from "../../docs/generator";
import { DocsSidebar } from "./sidebar";

import classes from "./docs.module.css";

export const MarkdownLayout = ({
  docFiles,
  children,
}: {
  docFiles: Array<DocFile>;
  children: React.ReactNode;
}) => {
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm" }}
      padding="md"
    >
      <DocsSidebar docFiles={docFiles} />
      <AppShellMain className={classes.main}>
        {children}
      </AppShellMain>
    </AppShell>
  );
};
