"use client";

// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Button, createStyles } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { UserPanel } from "../user/UserPanel";

const useStyles = createStyles((theme) => ({
  portrait: { borderRadius: theme.radius.sm },
}));

export function UserAnchor() {
  const { data: session } = useSession();
  const { classes } = useStyles();
  const [opened, { open, close }] = useDisclosure(false);

  if (session) {
    const user = session.user;

    return (
      <>
        <Image
          className={classes.portrait}
          src={user.image!}
          title={`Logged in ${user.name}`}
          alt="Picture of logged in user"
          width={40}
          height={40}
          onClick={open}
        />
        {opened && (
          <UserPanel session={session} open={opened} onClose={close} />
        )}
      </>
    );
  }

  return (
    <>
      <Button variant="default" compact onClick={() => signIn()}>
        Sign in
      </Button>
    </>
  );
}
