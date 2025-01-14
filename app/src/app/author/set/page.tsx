// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { options } from "@/auth/options";
import { userIsAuthor } from "@/auth/page-guards";
import { Unauthorized } from "@/shared/unauthorized";
import { db } from "@lxcat/database";
import { getServerSession } from "next-auth/next";
import { ClientPage } from "./client-page";

const Page = async () => {
  const session = await getServerSession(options);

  if (!userIsAuthor(session)) {
    return <Unauthorized />;
  }

  const user = session.user;
  const sets = await db().listOwnedSets(user.email);

  return <ClientPage user={user} initialItems={sets} />;
};

export default Page;
