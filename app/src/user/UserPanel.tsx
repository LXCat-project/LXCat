"use client";

import { Role } from "@lxcat/database/dist/auth/schema";
import { Card, Drawer, NavLink, Space } from "@mantine/core";
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
import { UserInfoIcons } from "./UserInfo";

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
            <NavLink icon=<IconUsersGroup /> label="Admin" childrenOffset={28}>
              <NavLink icon=<IconUser /> label="Manage users" />
              <NavLink icon=<IconUsers /> label="Manage organizations" />
            </NavLink>
          </>
        )}
        {(roles && roles.includes(Role.enum.author)) && (
          <>
            <NavLink icon=<IconFileUpload /> label="Author" childrenOffset={28}>
              <NavLink icon=<IconEdit /> label="Manage cross section sets" />
            </NavLink>
          </>
        )}
        {(roles && roles.includes(Role.enum.developer)) && (
          <>
            <NavLink
              icon=<IconTerminal2 />
              label="Developer"
              childrenOffset={28}
            >
              <NavLink icon=<IconApi /> label="Generate API token" />
            </NavLink>
          </>
        )}
      </Card>
    </Drawer>
  );
};
