"use client";

import { Role } from "@lxcat/database/dist/auth/schema";
import {
  Button,
  Card,
  Center,
  createStyles,
  Drawer,
  NavLink,
  Space,
} from "@mantine/core";
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
import { UserInfoIcons } from "./UserInfo";

const useStyles = createStyles(() => ({
  inner: {
    marginTop: 59,
    height: "100%",
  },
  overlay: {
    marginTop: 59,
    height: "100%",
    width: "100%",
  },
}));

export const UserPanel = (
  { session, open, onClose }: {
    session: Session;
    open: boolean;
    onClose: () => void | Promise<void>;
  },
) => {
  const roles = session.user.roles;
  const { classes } = useStyles();

  return (
    <Drawer
      opened={open}
      onClose={onClose}
      position="right"
      size="sm"
      classNames={{ ...classes }}
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
              icon=<IconUsersGroup size="1.3rem" />
              label="Admin"
              childrenOffset={28}
            >
              <NavLink
                component="a"
                href="/admin/users"
                icon=<IconUser size="1.3rem" />
                label="Manage users"
              />
              <NavLink
                component="a"
                href="/admin/organizations"
                icon=<IconUsers size="1.3rem" />
                label="Manage organizations"
              />
            </NavLink>
          </>
        )}
        {(roles && roles.includes(Role.enum.author)) && (
          <>
            <NavLink
              icon=<IconFileUpload size="1.3rem" />
              label="Author"
              childrenOffset={28}
            >
              <NavLink
                component="a"
                href="/author/scat-css"
                icon=<IconEdit size="1.3rem" />
                label="Manage cross section sets"
              />
              <NavLink
                component="a"
                href="/author/scat-cs"
                icon=<IconEdit size="1.3rem" />
                label="Manage cross sections"
              />
            </NavLink>
          </>
        )}
        {(roles && roles.includes(Role.enum.developer)) && (
          <>
            <NavLink
              icon=<IconTerminal2 size="1.3rem" />
              label="Developer"
              childrenOffset={28}
            >
              <NavLink
                component="a"
                href="/developer"
                icon=<IconApi size="1.3rem" />
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
