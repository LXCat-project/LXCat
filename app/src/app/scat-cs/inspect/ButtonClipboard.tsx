// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Button, Tooltip } from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { IconCheck, IconCopy } from "@tabler/icons-react";

export const ButtonClipboard = (
  { children, link }: { children: React.ReactNode; link: string },
) => {
  const clipboard = useClipboard();
  return (
    <Tooltip
      label="Link copied!"
      offset={5}
      position="bottom"
      radius="xl"
      transitionProps={{ duration: 100, transition: "slide-down" }}
      opened={clipboard.copied}
    >
      <Button
        variant="light"
        rightSection={clipboard.copied
          ? <IconCheck size="1.2rem" stroke={1.5} />
          : <IconCopy size="1.2rem" stroke={1.5} />}
        radius="sm"
        size="md"
        styles={{
          // root: { paddingRight: rem(14), height: rem(48) },
          // rightIcon: { marginLeft: rem(22) },
        }}
        onClick={() => clipboard.copy(link)}
      >
        {children}
      </Button>
    </Tooltip>
  );
};
