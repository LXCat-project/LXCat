// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import classes from "./nav-bar.module.css";

import { UserAnchor } from "@/auth/user-anchor";
import { Burger, Center, Container, Group, Menu } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconChevronDown,
  IconDatabase,
  IconFileText,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { LXCatLogo } from "../logo";
import { ColorSchemeToggle } from "./color-scheme-toggle";

const links = [
  {
    icon: (
      <IconDatabase
        size="1.2rem"
        strokeWidth={2}
        className={classes.linkIcon}
      />
    ),
    label: "Data center",
    link: "#1",
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
    icon: (
      <IconUsers
        size="1.2rem"
        strokeWidth={2}
        className={classes.linkIcon}
      />
    ),
    link: "/team",
    label: "Team",
  },
  {
    icon: (
      <IconFileText
        size="1.2rem"
        strokeWidth={2}
        className={classes.linkIcon}
      />
    ),
    link: "/docs/0-index",
    label: "Documentation",
    links: [
      {
        link: "/docs/0-index",
        label: "General",
      },
      {
        link: "/api-doc",
        label: "API",
      },
    ],
  },
];

export function NavBar() {
  const [opened, { toggle }] = useDisclosure(false);

  const items = links.map((link) => {
    const menuItems = link.links?.map((item) => (
      <Link key={item.link} href={item.link} className={classes.item}>
        <Menu.Item key={item.link}>
          {item.label}
        </Menu.Item>
      </Link>
    ));

    if (menuItems) {
      return (
        <Menu
          key={link.label}
          trigger="hover"
          transitionProps={{ exitDuration: 0 }}
          withinPortal
        >
          <Menu.Target>
            <a
              href={link.link}
              className={classes.link}
              onClick={(event) => event.preventDefault()}
            >
              <Center>
                {link.icon}
                <span className={classes.linkLabel}>{link.label}</span>
                <IconChevronDown size="0.9rem" stroke={1.5} />
              </Center>
            </a>
          </Menu.Target>
          <Menu.Dropdown>{menuItems}</Menu.Dropdown>
        </Menu>
      );
    }

    return (
      <a
        key={link.label}
        href={link.link}
        className={classes.link}
      >
        <Center>
          {link.icon}
          <span className={classes.linkLabel}>{link.label}</span>
        </Center>
      </a>
    );
  });

  return (
    <header className={classes.header}>
      <Container size="md">
        <div className={classes.inner}>
          <Link href="/">
            <LXCatLogo
              boxClassName={classes.logoBox}
              pathClassName={classes.logoPath}
            />
          </Link>

          <Group gap={5} visibleFrom="sm">
            {items}
          </Group>
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />

          <Group gap="sm">
            <ColorSchemeToggle />
            <UserAnchor />
          </Group>
        </div>
      </Container>
    </header>
  );
}
