// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { DocFile } from "@/docs/generator";
import { DocEntry } from "@/shared/doc-entry";
import { AppShellNavbar, AppShellSection, ScrollArea } from "@mantine/core";

export const DocsSidebar = ({
  docFiles,
}: {
  docFiles: Array<DocFile>;
}) => {
  return (
    <AppShellNavbar p="xs">
      <AppShellSection grow component={ScrollArea} type="scroll">
        {docFiles.flatMap((file) =>
          file.entries
            ? (
              file.entries.map((section) => {
                return (
                  <DocEntry
                    key={`${file.name}-${section.title}`}
                    fileName={file.name}
                    section={section}
                  />
                );
              })
            )
            : <></>
        )}
      </AppShellSection>
    </AppShellNavbar>
  );
};
