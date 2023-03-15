"use client";

import { Button, rem, Tooltip } from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { IconCheck, IconCopy } from "@tabler/icons";

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
        rightIcon={clipboard.copied
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
