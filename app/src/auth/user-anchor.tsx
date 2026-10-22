"use client";

// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Avatar, Button, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { signIn, useSession } from "next-auth/react";
import { UserPanel } from "../user/user-panel";

export function UserAnchor() {
  const { data: session } = useSession();
  const [opened, { open, close }] = useDisclosure(false);

  if (session) {
    const user = session.user;
    const name = user.name ?? user.email;

    return (
      <>
        <UnstyledButton
          onClick={open}
          title={`Logged in ${name}`}
          aria-label={`Open user panel of ${name}`}
          style={{ borderRadius: "var(--mantine-radius-xl)" }}
        >
          <Avatar
            src={user.image}
            name={name}
            alt="Picture of logged in user"
            radius="xl"
            size={44}
            bd="none"
            color="brand"
          />
        </UnstyledButton>
        <UserPanel session={session} open={opened} onClose={close} />
      </>
    );
  }

  return (
    <Button size="sm" onClick={() => signIn()}>
      Sign in
    </Button>
  );
}
