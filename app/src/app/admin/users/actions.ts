// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { requireAdmin } from "@/auth/action-guards";
import { actionErr, actionOk, ActionResult } from "@/shared/action-result";
import { LXCatID } from "@/shared/lxcatid";
import { db } from "@lxcat/database";
import { Role } from "@lxcat/database/auth";
import { z } from "zod";

export async function updateRoleAction(
  userKey: unknown,
  role: unknown,
): Promise<ActionResult<Array<Role>>> {
  await requireAdmin();
  const roles = await db().toggleRole(
    z.string().parse(userKey),
    Role.parse(role),
  );
  return roles ? actionOk(roles) : actionErr("User does not exist.");
}

export async function deleteUserAction(
  userKey: unknown,
): Promise<ActionResult<null>> {
  await requireAdmin();
  await db().dropUser(LXCatID.parse(userKey));
  return actionOk(null);
}

export async function updateOrganizationAction(
  userKey: unknown,
  organizationKeys: unknown,
): Promise<ActionResult<Array<string>>> {
  await requireAdmin();
  const keys = z.array(LXCatID).parse(organizationKeys);
  await db().setAffiliations(z.string().parse(userKey), keys);
  return actionOk(keys);
}
