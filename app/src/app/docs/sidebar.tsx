// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { DocEntry } from "@/docs/doc-entry";
import { DocFile } from "@/docs/generator";
import { Box, Button, Drawer } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconMenu2 } from "@tabler/icons-react";
import classes from "./docs.module.css";

const DocEntries = (
  { docFiles, onNavigate }: {
    docFiles: Array<DocFile>;
    onNavigate?: () => void;
  },
) => (
  <nav aria-label="Documentation">
    {docFiles.flatMap((file) =>
      file.entries?.map((section) => (
        <DocEntry
          key={`${file.name}-${section.title}`}
          fileName={file.name}
          section={section}
          onNavigate={onNavigate}
        />
      )) ?? []
    )}
  </nav>
);

/** Table of contents shown beside the documentation on wide screens. */
export const DocsSidebar = ({ docFiles }: { docFiles: Array<DocFile> }) => (
  <Box visibleFrom="sm" className={classes.sidebar}>
    <DocEntries docFiles={docFiles} />
  </Box>
);

/** Button that opens the table of contents in a drawer on narrow screens. */
export const DocsMobileNav = ({ docFiles }: { docFiles: Array<DocFile> }) => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button
        variant="default"
        size="sm"
        hiddenFrom="sm"
        mb="md"
        leftSection={<IconMenu2 size="1rem" />}
        onClick={open}
      >
        Browse documentation
      </Button>
      <Drawer
        opened={opened}
        onClose={close}
        title="Documentation"
        size="min(20rem, 100%)"
        hiddenFrom="sm"
      >
        <DocEntries docFiles={docFiles} onNavigate={close} />
      </Drawer>
    </>
  );
};
