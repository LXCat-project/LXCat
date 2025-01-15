// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { options } from "@/auth/options";
import { userIsAdmin } from "@/auth/page-guards";
import { Unauthorized } from "@/shared/unauthorized";
import { db } from "@lxcat/database";
import { getServerSession } from "next-auth/next";
import { AdminUsersClient } from "./client-page";

export default async function AdminUsersPage() {
  const session = await getServerSession(options);

  if (!userIsAdmin(session)) {
    return <Unauthorized />;
  }

  const me = session.user;
  const users = await db().listUsers();
  const organizations = await db().listOrganizations();

  return (
    <AdminUsersClient me={me} users={users} organizations={organizations} />
  );
}
