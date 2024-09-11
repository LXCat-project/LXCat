// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { aql } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { LXCatDatabase } from "../../lxcat-database.js";

export async function upsertOrganization(
  this: LXCatDatabase,
  name: string,
  description: string = "",
  contact: string = "",
  howToReference: string = "",
) {
  const organization = await this.upsertDocument("Organization", {
    name,
    description,
    contact,
    howToReference,
  });
  return organization.id;
}

export async function getOrganizationByName(this: LXCatDatabase, name: string) {
  const cursor: ArrayCursor<string> = await this.db.query(aql`
    FOR org IN Organization
      FILTER org.name == ${name}
      LIMIT 1
      RETURN org._id
    `);
  return cursor.next();
}
