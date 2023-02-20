// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button, createStyles } from "@mantine/core";

const useStyles = createStyles((theme) => ({
  portrait: { borderRadius: theme.radius.sm },
}));

export function UserAnchor() {
  const { data: session } = useSession();
  const { classes } = useStyles();

  if (session) {
    const user = session.user;
    return (
      <>
        <Link href="/profile">
          <Image
            className={classes.portrait}
            src={user.image!}
            title={`Logged in ${user.name}`}
            alt="Picture of logged in user"
            width={40}
            height={40}
          />
        </Link>
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
