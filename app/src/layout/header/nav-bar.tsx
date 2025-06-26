// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import classes from "./nav-bar.module.css";

import { UserAnchor } from "@/auth/user-anchor";
import { ChemCatLogo } from "@/shared/chemcat-logo";
import {
  Burger,
  Container,
  Group,
  Menu,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { ColorSchemeToggle } from "./color-scheme-toggle";
import { MobileNav } from "./mobile-nav";
import { isLinkActive, type NavLink, navLinks } from "./nav-links";

const NavMenu = (
  { link, active }: {
    link: Extract<NavLink, { groups: unknown }>;
    active: boolean;
  },
) => (
  <Menu
    trigger="click-hover"
    openDelay={80}
    closeDelay={120}
    position="bottom-start"
    offset={6}
    shadow="md"
    width={280}
  >
    <Menu.Target>
      <UnstyledButton
        className={classes.link}
        data-active={active || undefined}
      >
        <span>{link.label}</span>
        <IconChevronDown
          size="0.9rem"
          stroke={1.5}
          className={classes.chevron}
        />
      </UnstyledButton>
    </Menu.Target>
    <Menu.Dropdown>
      {link.groups.map((group, index) => (
        <Fragment key={group.label ?? index}>
          {index > 0 && <Menu.Divider />}
          {group.label && <Menu.Label>{group.label}</Menu.Label>}
          {group.items.map((item) => (
            <Menu.Item
              key={item.href}
              component={Link}
              href={item.href}
              className={classes.item}
              leftSection={
                <ThemeIcon variant="light" size={32}>
                  <item.icon size="1.1rem" stroke={1.5} />
                </ThemeIcon>
              }
            >
              <Text size="sm" fw={500}>{item.label}</Text>
              <Text size="xs" c="dimmed">{item.description}</Text>
            </Menu.Item>
          ))}
        </Fragment>
      ))}
    </Menu.Dropdown>
  </Menu>
);

export function NavBar() {
  const pathname = usePathname();
  const [opened, { toggle, close }] = useDisclosure(false);

  const items = navLinks.map((link) => {
    const active = isLinkActive(link, pathname);

    if ("groups" in link) {
      return <NavMenu key={link.label} link={link} active={active} />;
    }

    return (
      <Link
        key={link.label}
        href={link.href}
        className={classes.link}
        data-active={active || undefined}
        aria-current={active ? "page" : undefined}
      >
        {link.label}
      </Link>
    );
  });

  return (
    <header className={classes.header}>
      <Container size="xl" h="100%">
        <div className={classes.inner}>
          <Group gap="xl" wrap="nowrap">
            <Link
              href="/"
              className={classes.logoLink}
              aria-label="ChemCat home"
            >
              <ChemCatLogo
                boxClassName={classes.logoBox}
                textClassName={classes.logoText}
                pathClassName={classes.logoPath}
              />
            </Link>
            <Group gap={4} visibleFrom="sm" component="nav" aria-label="Main">
              {items}
            </Group>
          </Group>

          <Group gap="xs" wrap="nowrap">
            <ColorSchemeToggle />
            <UserAnchor />
            <Burger
              opened={opened}
              aria-expanded={opened}
              onClick={toggle}
              size="sm"
              hiddenFrom="sm"
              aria-label="Toggle navigation"
            />
          </Group>
        </div>
      </Container>
      <MobileNav opened={opened} onClose={close} />
    </header>
  );
}
