"use client";

import {
  createStyles,
  Group,
  Menu,
  rem,
  ScrollArea,
  Sx,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { Latex } from "./Latex";

const useStyles = createStyles((theme, { opened }: { opened: boolean }) => ({
  control: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `calc(${theme.spacing.xs}/2) ${theme.spacing.sm}`,
    borderRadius: theme.radius.sm,
    border: `${rem(1)} solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[3]
    }`,
    transition: "background-color 150ms ease",
    backgroundColor: theme.colorScheme === "dark"
      ? theme.colors.dark[opened ? 5 : 6]
      : opened
      ? theme.colors.gray[0]
      : theme.white,

    "&:hover": {
      backgroundColor: theme.colorScheme === "dark"
        ? theme.colors.dark[5]
        : theme.colors.gray[0],
    },

    "&:active": {
      backgroundColor: theme.colorScheme === "dark"
        ? theme.colors.dark[6]
        : theme.colors.gray[1],
    },
  },

  item: {
    borderRadius: theme.radius.sm,
  },

  dropdown: {
    borderRadius: theme.radius.sm,
  },

  label: {
    fontWeight: 500,
    fontSize: theme.fontSizes.sm,
  },

  icon: {
    transition: "transform 150ms ease",
    transform: opened ? "rotate(180deg)" : "rotate(0deg)",
  },
}));

export type LatexSelectProps = {
  data: Record<string, string>;
  placeholder?: React.ReactNode;
  value?: string;
  onChange: (value?: string) => Promise<void> | void;
  name?: string;
  clearable?: boolean;
  sx?: Sx;
};

export function LatexSelect(
  { data, placeholder, value, onChange, name, clearable, sx }: LatexSelectProps,
) {
  const [opened, setOpened] = useState(false);
  const { classes } = useStyles({ opened });

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
