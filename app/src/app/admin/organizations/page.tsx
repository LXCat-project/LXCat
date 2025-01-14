// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { options } from "@/auth/options";
import { userIsAdmin } from "@/auth/page-guards";
import { Unauthorized } from "@/shared/unauthorized";
import { db } from "@lxcat/database";
import { getServerSession } from "next-auth/next";
import { AdminOrganizationsPage } from "./client-page";

export default async function() {
  const session = await getServerSession(options);

  if (!userIsAdmin(session)) {
    return <Unauthorized />;
  }

  const organizations = await db().listOrganizations();

  return <AdminOrganizationsPage organizations={organizations} />;
}
