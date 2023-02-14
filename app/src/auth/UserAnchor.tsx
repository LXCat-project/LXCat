// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export function UserAnchor() {
  const { data: session } = useSession();
  if (session) {
    const user = session.user;
    return (
      <>
        <Link href="/profile">
          <Image
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
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
}
