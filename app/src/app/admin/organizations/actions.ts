// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { requireAdmin } from "@/auth/action-guards";
import { actionErr, actionOk, ActionResult } from "@/shared/action-result";
import { LXCatID } from "@/shared/lxcatid";
import { db } from "@lxcat/database";
import { KeyedOrganization } from "@lxcat/database/auth";
import { Contributor } from "@lxcat/schema";
import { z } from "zod";

export async function addOrganizationAction(
  organization: unknown,
): Promise<ActionResult<KeyedOrganization>> {
  await requireAdmin();
  const org = Contributor.parse(organization);
  const result = await db().addOrganization(org);

  if (result.isOk) {
    return actionOk({ ...org, _key: result.value });
  }
  return actionErr(
    result.error.errorNum === 1210
      ? "Organization already exists."
      : result.error.message,
  );
}

export async function dropOrganizationAction(
  key: unknown,
): Promise<ActionResult<null>> {
  await requireAdmin();
  const orgKey = LXCatID.parse(z.string().parse(key));

  const exists = (await db().listContributors())
    .find((org) => org._key === orgKey);

  if (!exists) {
    return actionErr(`Organization with key ${orgKey} does not exist.`);
  }

  if (exists.totalSets > 0) {
    return actionErr(`The ${exists.name} organization owns active datasets`);
  }

  await db().dropOrganization(orgKey);
  return actionOk(null);
}
