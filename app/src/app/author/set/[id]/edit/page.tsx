// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { options } from "@/auth/options";
import { NotFound } from "@/shared/not-found";
import { Unauthorized } from "@/shared/unauthorized";
import { db } from "@lxcat/database";
import { EditedLTPDocument } from "@lxcat/schema";
import { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { EditForm } from "./edit-form";

const ArangoKey = z.string().regex(/\d+/);
const URLParams = z.object({ params: z.promise(z.object({ id: ArangoKey })) });

type URLParams = z.infer<typeof URLParams>;

const EditSetPage = async (props: URLParams) => {
  const { id } = await URLParams.parse(props).params;
  const session = await getServerSession(options);

  if (!(userIsAuthor(session) && await userOwnsSet(session.user.email, id))) {
    return <Unauthorized />;
  }

  const set = await db().getSetById(id, true);

  if (!set) return <NotFound />;

  return (
    <EditForm
      initialSet={EditedLTPDocument.parse({
        ...set,
        contributor: set.contributor.name,
      })}
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

const userIsAuthor = (session: Session | null): session is Session => {
  if (session !== null && session.user.roles?.includes("author")) {
    return true;
  }
  return false;
};

export default EditSetPage;
