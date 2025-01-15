// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { options } from "@/auth/options";
import { userIsAuthor } from "@/auth/page-guards";
import { Unauthorized } from "@/shared/unauthorized";
import { getServerSession } from "next-auth/next";
import { AddRawSetClient } from "./client-page";

export default async function AddRawSetPage() {
  const session = await getServerSession(options);

  if (!userIsAuthor(session)) {
    return <Unauthorized />;
  }

  return <AddRawSetClient />;
}
