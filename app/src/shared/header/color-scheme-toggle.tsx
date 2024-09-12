// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ActionIcon, Group, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import cx from "clsx";
import classes from "./color-scheme-toggle.module.css";

export function ColorSchemeToggle() {
  const { toggleColorScheme } = useMantineColorScheme();

  return (
    <Group justify="center">
      <ActionIcon
        onClick={toggleColorScheme}
        variant="default"
        size="lg"
        aria-label="Toggle color scheme"
      >
        <IconSun className={cx(classes.icon, classes.light)} stroke={2} />
        <IconMoon className={cx(classes.icon, classes.dark)} stroke={2} />
      </ActionIcon>
    </Group>
  );
}
