// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "../../db";
import { upsertDocument } from "../queries";

export async function upsertOrganization(name: string) {
  const organization = await upsertDocument("Organization", {
    name,
  });
  return organization.id;
}

export async function getAffiliations(email: string): Promise<Array<string>> {
  const organizations = await db().query(
    `
      FOR user IN users
        FILTER user.email == @email
        FOR org IN OUTBOUND user MemberOf
          RETURN org.name
    `,
    { email },
  );
  return organizations.all();
}
