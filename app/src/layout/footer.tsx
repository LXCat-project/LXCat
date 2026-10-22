// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Anchor, Container, Group, Text } from "@mantine/core";

import classes from "./footer.module.css";

const links = [
  { label: "Documentation", href: "/docs/0-index" },
  { label: "API", href: "/api-doc" },
  { label: "GitHub", href: "https://github.com/LXCat-project/LXCat" },
  { label: "Contact", href: "mailto:info@lxcat.net" },
  { label: "LXCat 2", href: "https://www.lxcat.net" },
];

export const Footer = () => (
  <footer className={classes.footer}>
    <Container size="xl">
      <Group justify="space-between" gap="md">
        <Text size="sm" c="dimmed">
          &copy; 2009&ndash;{new Date().getFullYear()} the LXCat team
        </Text>
        <Group gap="lg" component="nav" aria-label="Footer">
          {links.map((link) => (
            <Anchor key={link.label} href={link.href} size="sm" c="dimmed">
              {link.label}
            </Anchor>
          ))}
        </Group>
      </Group>
    </Container>
  </footer>
);
