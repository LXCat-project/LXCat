// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { PageClient } from "./page-client";

const Page = async () => {
  const activeElements = new Set(await db().getActiveElements());

  return <PageClient activeElements={activeElements} />;
};

export default Page;

export const dynamic = "force-dynamic";
