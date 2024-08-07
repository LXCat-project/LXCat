// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { AppShell, AppShellMain } from "@mantine/core";
import { DocFile } from "../../docs/generator";
import { DocsSidebar } from "./sidebar";

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
    >
      <DocsSidebar docFiles={docFiles} />
      <AppShellMain>
        {children}
      </AppShellMain>
    </AppShell>
  );
};
