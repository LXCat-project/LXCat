// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { Center } from "@mantine/core";
import { PeriodicTable } from "./periodic-table";

const Page = async () => {
  const activeElements = new Set(await db().getActiveElements());

  return (
    <Center>
      <PeriodicTable activeElements={activeElements} />
    </Center>
  );
};

export default Page;
