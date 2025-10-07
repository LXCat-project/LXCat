// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Role } from "@lxcat/database/auth";
import { Button, Card, Center, Drawer, NavLink, Space } from "@mantine/core";
import {
  IconApi,
  IconEdit,
  IconFileUpload,
  IconTerminal2,
  IconUser,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { UserInfoIcons } from "./user-info";
import classes from "./user.module.css";

export const UserPanel = (
  { session, open, onClose }: {
    session: Session;
    open: boolean;
    onClose: () => void | Promise<void>;
  },
) => {
  const roles = session.user.roles;

  return (
    <Drawer
      opened={open}
      onClose={onClose}
      position="right"
      size="sm"
      classNames={{ inner: classes.panelInner, overlay: classes.panelOverlay }}
    >
      <Card withBorder>
        <UserInfoIcons
          avatar={session.user.image!}
          name={session.user.name!}
          orcid={session.user.orcid}
          email={session.user.email}
        />
        <Space h="md" />
        {(roles && roles.includes(Role.enum.admin)) && (
          <>
            <NavLink
              leftSection=<IconUsersGroup size="1.3rem" />
              label="Admin"
              childrenOffset={28}
            >
              <NavLink
                component="a"
                href="/admin/users"
                leftSection=<IconUser size="1.3rem" />
                label="Manage users"
              />
              <NavLink
                component="a"
                href="/admin/organizations"
                leftSection=<IconUsers size="1.3rem" />
                label="Manage organizations"
              />
            </NavLink>
          </>
        )}
        {(roles && roles.includes(Role.enum.author)) && (
          <>
            <NavLink
              leftSection=<IconFileUpload size="1.3rem" />
              label="Author"
              childrenOffset={28}
            >
              <NavLink
                component="a"
                href="/author/set"
                leftSection=<IconEdit size="1.3rem" />
                label="Manage cross section sets"
              />
              {
                // <NavLink
                //   component="a"
                //   href="/author/data"
                //   leftSection=<IconEdit size="1.3rem" />
                //   label="Manage cross sections"
                // />
              }
            </NavLink>
          </>
        )}
        {(roles && roles.includes(Role.enum.developer)) && (
          <>
            <NavLink
              leftSection=<IconTerminal2 size="1.3rem" />
              label="Developer"
              childrenOffset={28}
            >
              <NavLink
                component="a"
                href="/developer"
                leftSection=<IconApi size="1.3rem" />
                label="Generate API token"
              />
            </NavLink>
          </>
        )}
        <Space h="md" />
        <Center>
          <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
        </Center>
      </Card>
    </Drawer>
  );
};
