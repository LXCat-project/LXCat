// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Navbar, ScrollArea } from "@mantine/core";
import { DocFile } from "../../docs/generator";
import { DocEntry } from "../../shared/DocEntry";

export const DocsSidebar = ({
  docFiles,
}: {
  docFiles: Array<DocFile>;
}) => {
  return (
    <Navbar sx={{ zIndex: 10 }} p="xs" width={{ base: 300 }}>
      <Navbar.Section grow component={ScrollArea} type="scroll">
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
      </Navbar.Section>
    </Navbar>
  );
};
