// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { toResult } from "@/shared/action-result";
import { Role, UserFromDB } from "@lxcat/database/auth";
import { Result, Unit } from "true-myth";
import { ok } from "true-myth/result";
import {
  deleteUserAction,
  updateOrganizationAction,
  updateRoleAction,
} from "./actions";

export const updateRole = async (
  user: UserFromDB,
  role: Role,
): Promise<Result<Array<Role>, string>> =>
  toResult(await updateRoleAction(user._key, role));

export const deleteUser = async (
  user: UserFromDB,
): Promise<Result<Unit, string>> =>
  toResult(await deleteUserAction(user._key)).andThen(() => ok());

export const updateOrganization = async (
  user: UserFromDB,
  organizationKeys: string[],
): Promise<Result<Array<string>, string>> =>
  toResult(await updateOrganizationAction(user._key, organizationKeys));
