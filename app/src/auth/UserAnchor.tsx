"use client";

// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { UserPanel } from "../user/UserPanel";
import classes from "./auth.module.css";

export function UserAnchor() {
  const { data: session } = useSession();
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
      <Button variant="default" size="compact-md" onClick={() => signIn()}>
        Sign in
      </Button>
    </>
  );
}
