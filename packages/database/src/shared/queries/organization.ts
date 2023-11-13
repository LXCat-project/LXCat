// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatDatabase } from "../../lxcat-database";

export async function upsertOrganization(this: LXCatDatabase, name: string) {
  const organization = await this.upsertDocument("Organization", {
    name,
  });
  return organization.id;
}
