// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { options } from "@/auth/options";
import { Unauthorized } from "@/shared/unauthorized";
import { db } from "@lxcat/database";
import { getServerSession } from "next-auth";
import { EditForm } from "../[id]/edit/edit-form";
import { emptySet } from "../empty-set";

const AddSetPage = async () => {
  const session = await getServerSession(options);

  if (!session) {
    return <Unauthorized />;
  }

  return (
    <EditForm
      initialSet={emptySet()}
      organizations={await db().getAffiliations(session.user.email)}
    />
  );
};

export default AddSetPage;
