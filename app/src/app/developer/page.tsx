// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { options } from "@/auth/options";
import { userIsDeveloper } from "@/auth/page-guards";
import { Unauthorized } from "@/shared/ui/unauthorized";
import { getServerSession } from "next-auth/next";
import { listTokensAction } from "./actions";
import { DeveloperClientPage } from "./client-page";

const DeveloperPage = async () => {
  const session = await getServerSession(options);

  if (!userIsDeveloper(session)) {
    return <Unauthorized />;
  }

  return <DeveloperClientPage initialTokens={await listTokensAction()} />;
};

export default DeveloperPage;
