// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import {
  Container,
  createStyles,
  Group,
  Header,
  Menu,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconDatabase, IconFileText, IconUsers } from "@tabler/icons-react";
import Link from "next/link";
import { UserAnchor } from "../auth/UserAnchor";
import { LXCatLogo } from "./Logo";

const useStyles = createStyles((theme) => ({
  bar: {
    backgroundColor: theme.colors.brand[6],
    alignItems: "center",
    display: "flex",
    paddingLeft: 24,
    paddingRight: 24,
  },
  dropdownItem: {
    ":hover": {
      textDecorationLine: "none",
    },
  },
  menuItem: {
    color: theme.colors.brand[0],
    backgroundColor: theme.colors.brand[6],
    padding: "8px 12px",
    borderRadius: theme.radius.sm,
    "&:hover": {
      backgroundColor: theme.fn.darken(theme.colors.brand[6], 0.1),
      textDecorationLine: "none",
    },
  },
}));

const entries = [
  {
    icon: <IconDatabase />,
    label: "Data center",
    links: [
      {
        link: "/scat-cs",
        label: "Cross sections",
      },
      {
        link: "/scat-css",
        label: "Cross section sets",
      },
    ],
  },
  {
    icon: <IconUsers />,
    link: "/team",
    label: "Team",
  },
  {
    icon: <IconFileText />,
    link: "/docs/index",
    label: "Documentation",
  },
];

export const NavBar = () => {
  const { classes, theme } = useStyles();

  const barItems = entries.map((entry) => {
    const menuItems = entry.links?.map((item) => (
      <Menu.Item
        component="a"
        className={classes.dropdownItem}
        key={item.link}
        href={item.link}
      >
        {item.label}
      </Menu.Item>
    ));

    if (menuItems) {
      return (
        <Menu
          key={entry.label}
          trigger="hover"
          transitionProps={{ exitDuration: 0 }}
        >
          <Menu.Target>
            <UnstyledButton className={classes.menuItem}>
              <Group spacing="xs">
                {entry.icon}
                <Text>{entry.label}</Text>
              </Group>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>{menuItems}</Menu.Dropdown>
        </Menu>
      );
    }

    return (
      <UnstyledButton
        key={entry.label}
        component="a"
        className={classes.menuItem}
        href={entry.link}
      >
        <Group spacing="xs">
          {entry.icon}
          <Text>{entry.label}</Text>
        </Group>
      </UnstyledButton>
    );
  });

  return (
    <Header height={60} className={classes.bar}>
      <Link href="/">
        <LXCatLogo height={70} width={70} color={theme.colors.brand[0]} />
      </Link>
      <Container style={{ display: "flex" }}>
        <Group spacing={3}>{barItems}</Group>
      </Container>
      <UserAnchor />
    </Header>
  );
};
