// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Container, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import { IconDatabase, IconFileText, IconUsers } from "@tabler/icons-react";
import Link from "next/link";
import { UserAnchor } from "../auth/user-anchor";
import { LXCatLogo } from "./logo";
import classes from "./nav-bar.module.css";

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
        link: "/cs-set",
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
              <Group gap="xs">
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
        <Group gap="xs">
          {entry.icon}
          <Text>{entry.label}</Text>
        </Group>
      </UnstyledButton>
    );
  });

  return (
    <header className={classes.bar}>
      <Link href="/">
        <LXCatLogo
          boxClassName={classes.logoBox}
          pathClassName={classes.logoPath}
        />
      </Link>
      <Container style={{ display: "flex" }}>
        <Group gap={3}>{barItems}</Group>
      </Container>
      <UserAnchor />
    </header>
  );
};
