// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MaybePromise } from "@/app/api/util";
import { Button, Menu } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { LinkToggle } from "./link-toggle";

export const ButtonMultiDownload = (
  { children, entries }: {
    children: React.ReactNode;
    entries: Array<
      {
        text: string;
        link: string | (() => MaybePromise<void>);
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
          typeof link === "string"
            ? (
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
            )
            : (
              <Menu.Item
                key={index}
                onClick={async () => await link()}
                leftSection={icon}
                disabled={disabled}
              >
                {text}
              </Menu.Item>
            )
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
