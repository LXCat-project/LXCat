// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Button, Menu } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { LinkToggle } from "./LinkToggle";

export const ButtonMultiDownload = (
  { children, entries }: {
    children: React.ReactNode;
    entries: Array<
      {
        text: string;
        link: string;
        icon?: React.ReactNode;
        disabled?: boolean;
        fileName?: string;
      }
    >;
  },
) => {
  return (
    <Menu
      transitionProps={{ transition: "pop" }}
      position="top"
      withinPortal
    >
      <Menu.Target>
        <Button
          rightSection={<IconDownload size="1.05rem" stroke={1.5} />}
          pr={12}
          size="md"
        >
          {children}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {entries.map(({ text, link, icon, disabled, fileName }, index) => (
          <LinkToggle
            key={index}
            style={{
              textDecoration: "none",
            }}
            href={disabled ? "" : link}
            target="_blank"
            rel="noreferrer"
            download={fileName ?? true}
            disabled={disabled}
          >
            <Menu.Item leftSection={icon} disabled={disabled}>
              {text}
            </Menu.Item>
          </LinkToggle>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
