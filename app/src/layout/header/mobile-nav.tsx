// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import {
  Drawer,
  NavLink,
  ScrollArea,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import classes from "./nav-bar.module.css";
import { isLinkActive, navLinks } from "./nav-links";

export const MobileNav = ({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) => {
  const pathname = usePathname();
  const theme = useMantineTheme();
  // The drawer is only for narrow viewports. Closing it when the viewport
  // widens keeps its scroll lock and focus trap from outliving its burger, and
  // keeps it from reopening when the viewport narrows again.
  const wide = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`);

  useEffect(() => {
    if (wide) onClose();
  }, [wide, onClose]);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="min(20rem, 100%)"
      title="Menu"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <nav aria-label="Main">
        {navLinks.map((link) => {
          const active = isLinkActive(link, pathname);

          if ("href" in link) {
            return (
              <NavLink
                key={link.label}
                component={Link}
                href={link.href}
                label={link.label}
                className={classes.item}
                active={active}
                onClick={onClose}
              />
            );
          }

          return (
            <NavLink
              key={link.label}
              label={link.label}
              active={active}
              defaultOpened={active}
              childrenOffset={12}
            >
              {link.groups.map((group, index) => (
                <div key={group.label ?? index}>
                  {group.label && (
                    <Text size="xs" fw={500} c="dimmed" px="sm" pt="xs">
                      {group.label}
                    </Text>
                  )}
                  {group.items.map((item) => (
                    <NavLink
                      key={item.href}
                      component={Link}
                      href={item.href}
                      label={item.label}
                      description={item.description}
                      leftSection={<item.icon size="1.1rem" stroke={1.5} />}
                      className={classes.item}
                      onClick={onClose}
                    />
                  ))}
                </div>
              ))}
            </NavLink>
          );
        })}
      </nav>
    </Drawer>
  );
};
