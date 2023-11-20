// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Group, Menu, rem, ScrollArea, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { Latex } from "./Latex";
import classes from "./latex-select.module.css";

export type LatexSelectProps = {
  data: Record<string, string>;
  placeholder?: React.ReactNode;
  value?: string;
  onChange: (value?: string) => Promise<void> | void;
  name?: string;
  clearable?: boolean;
  // TODO: Replace with style and className.
  sx?: Sx;
};

export function LatexSelect(
  { data, placeholder, value, onChange, name, clearable, sx }: LatexSelectProps,
) {
  const [opened, setOpened] = useState(false);

  const items = Object.entries(data).map(([key, label]) => (
    <Menu.Item
      className={classes.item}
      onClick={() => onChange(key)}
      key={key}
      disabled={key === value}
      sx={(theme) =>
        key === value
          ? {
            backgroundColor: theme.colors.brand[5],
            ":disabled": { color: "white" },
          }
          : {}}
    >
      <Latex>{label}</Latex>
    </Menu.Item>
  ));

  return (
    <Menu
      onOpen={() => setOpened(true)}
      onClose={() => setOpened(false)}
      withinPortal
    >
      <Menu.Target>
        <UnstyledButton
          className={classes.control}
          sx={sx}
          data-button
        >
          <Group>
            {value ? <Latex>{data[value]}</Latex> : placeholder ?? ""}
            {value && clearable
              ? (
                <IconX
                  size="1rem"
                  stroke={1.5}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(undefined);
                  }}
                />
              )
              : (
                <IconChevronDown
                  size="1rem"
                  className={classes.icon}
                  stroke={1.5}
                  aria-controls={name}
                />
              )}
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown className={classes.dropdown}>
        <ScrollArea.Autosize mah="15rem">
          {items}
        </ScrollArea.Autosize>
      </Menu.Dropdown>
    </Menu>
  );
}
