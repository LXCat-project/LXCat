// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getSetAffiliation } from "@lxcat/database/src/css/queries/get-affiliation";
import { getAffiliations } from "@lxcat/database/src/shared/queries/organization";
import { Session } from "next-auth/core/types";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { options } from "../../../../../auth/options";
import { Unauthorized } from "../../../../../shared/unauthorized";

const ArangoKey = z.string().regex(/\d+/);
const URLParams = z.object({ params: z.object({ id: ArangoKey }) });

type URLParams = z.infer<typeof URLParams>;

const EditSetPage = async (props: URLParams) => {
  const { params: { id } } = URLParams.parse(props);
  const session = await getServerSession(options);

  if (!(userIsAuthor(session) && await userOwnsSet(session.user.email, id))) {
    return <Unauthorized />;
  }

  return <div></div>;
};

const userOwnsSet = async (email: string, setId: string): Promise<boolean> => {
  const userAffiliations = await getAffiliations(email);
  const setAffiliation = await getSetAffiliation(setId);

  if (setAffiliation === undefined) {
    return false;
  }

  return userAffiliations.includes(setAffiliation);
};

const userIsAuthor = (session: Session | null): session is Session => {
  if (session !== null && session.user.roles?.includes("author")) {
    return true;
  }
  return false;
};

export default EditSetPage;
