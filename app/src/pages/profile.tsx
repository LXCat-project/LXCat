// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Role } from "@lxcat/database/dist/auth/schema";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Layout } from "../shared/Layout";

const ProfilePage = () => {
  const { data: session } = useSession();
  if (!session) {
    return (
      <Layout>
        Not logged in <br />
        <button onClick={() => signIn()}>Sign in</button>
      </Layout>
    );
  }
  const isDeveloper = session.user.roles!.includes(Role.enum.developer);
  const isAdmin = session.user.roles!.includes(Role.enum.admin);
  const isAuthor = session.user.roles!.includes(Role.enum.author);
  const orcidURL = process.env.ORCID_SANDBOX
    ? `https://sandbox.orcid.org/${session.user.orcid}`
    : `https://orcid.org/${session.user.orcid}`;
  return (
    <Layout>
      <h1>Profile</h1>

      <div style={{ display: "flex", gap: "2rem" }}>
        <Image
          src={session.user.image!}
          title={`Logged in ${session.user.name}`}
          alt="Picture of logged in user"
          width={80}
          height={80}
        />
        <div>
          <div>Name</div>
          <div>{session.user.name}</div>
        </div>
        <div>
          <div>Email</div>
          <div>{session.user.email}</div>
        </div>
        <div>
          <div>Orcid</div>
          <div>
            <a target={"_blank"} rel="noreferrer" href={orcidURL}>
              {session.user.orcid}
            </a>
          </div>
        </div>
      </div>

      <ul>
        {isDeveloper && (
          <li>
            <Link href="/developer">Perform developer tasks</Link>
          </li>
        )}
        {isAdmin && (
          <li>
            <Link href="/admin">Perform admin tasks</Link>
          </li>
        )}
        {isAuthor && (
          <li>
            <Link href="/author">Perform author tasks</Link>
          </li>
        )}
      </ul>
      <div>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    </Layout>
  );
};

export default ProfilePage;
