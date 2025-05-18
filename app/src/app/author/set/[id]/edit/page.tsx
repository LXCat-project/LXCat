// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { options } from "@/auth/options";
import { userIsAuthor } from "@/auth/page-guards";
import { NotFound } from "@/shared/not-found";
import { Unauthorized } from "@/shared/unauthorized";
import { db } from "@lxcat/database";
import { intoEditable } from "@lxcat/schema/process";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { EditForm } from "./edit-form";

const ArangoKey = z.string().regex(/\d+/);
const URLParams = z.object({ id: ArangoKey });

const EditSetPage = async ({ params }: { params: Promise<unknown> }) => {
  const { id } = URLParams.parse(await params);
  const session = await getServerSession(options);

  if (!(userIsAuthor(session) && await userOwnsSet(session.user.email, id))) {
    return <Unauthorized />;
  }

  const set = await db().getSetById(id, true);

  if (!set) return <NotFound />;

  return (
    <EditForm
      initialSet={intoEditable(set)}
      organizations={await db().getAffiliations(session.user.email)}
    />
  );
};

const userOwnsSet = async (email: string, setId: string): Promise<boolean> => {
  const userAffiliations = await db().getAffiliations(email);
  const setAffiliation = await db().getSetAffiliation(setId);

  if (setAffiliation === undefined) {
    return false;
  }

  return userAffiliations.map(({ name }) => name).includes(setAffiliation);
};

export default EditSetPage;
