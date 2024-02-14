// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import {
  Group,
  MantineStyleProp,
  Menu,
  ScrollArea,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import clsx from "clsx";
import { useState } from "react";
import { Latex } from "./latex";
import classes from "./latex-select.module.css";

export type LatexSelectProps = {
  data: Record<string, string>;
  placeholder?: React.ReactNode;
  value?: string;
  onChange: (value?: string) => Promise<void> | void;
  name?: string;
  clearable?: boolean;
  style?: MantineStyleProp;
  className?: string;
  grow?: boolean;
};

export function LatexSelect(
  {
    data,
    placeholder,
    value,
    onChange,
    name,
    clearable,
    style,
    className,
    grow,
  }: LatexSelectProps,
) {
  const [opened, setOpened] = useState(false);

  const items = Object.entries(data).map(([key, label]) => (
    <Menu.Item
      className={clsx(classes.item, key === value && classes.itemSelected)}
      onClick={() => onChange(key)}
      key={key}
      disabled={key === value}
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
          className={clsx(
            classes.control,
            opened && classes.controlOpened,
            grow && classes.controlGrow,
            className,
          )}
          style={style}
          data-button
        >
          <Group style={{ width: "100%" }} justify="space-between">
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
                  className={clsx(classes.icon, {
                    [classes.iconRotated]: opened,
                  })}
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
