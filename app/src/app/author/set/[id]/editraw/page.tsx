// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { options } from "@/auth/options";
import { userIsAuthor } from "@/auth/page-guards";
import { Forbidden } from "@/shared/forbidden";
import { NotFound } from "@/shared/not-found";
import { Unauthorized } from "@/shared/unauthorized";
import { db } from "@lxcat/database";
import { intoEditable } from "@lxcat/schema/process";
import { getServerSession } from "next-auth/next";
import { object, promise, string, TypeOf } from "zod";
import { EditRawSetClient } from "./client-page";

const ArangoKey = string().regex(/\d+/);
const URLParams = object({ id: ArangoKey });

export default async function EditRawSetPage(
  { params }: { params: Promise<unknown> },
) {
  const { id } = URLParams.parse(await params);
  const session = await getServerSession(options);

  if (!userIsAuthor(session)) {
    return <Unauthorized />;
  }

  if (!await userOwnsSet(session.user.email, id)) {
    return <Forbidden />;
  }

  const set = await db().getSetById(id, true);

  if (!set) return <NotFound />;

  const versionInfo = await db().getSetVersionInfo(id);

  return (
    <EditRawSetClient
      set={intoEditable(set)}
      setKey={set._key}
      commitMessage={versionInfo?.commitMessage ?? ""}
    />
  );
}

const userOwnsSet = async (email: string, setId: string): Promise<boolean> => {
  const userAffiliations = await db().getAffiliations(email);
  const setAffiliation = await db().getSetAffiliation(setId);

  if (setAffiliation === undefined) {
    return false;
  }

  return userAffiliations.map(({ name }) => name).includes(setAffiliation);
};
