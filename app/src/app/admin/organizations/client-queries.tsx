// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { toResult } from "@/shared/action-result";
import { KeyedOrganization } from "@lxcat/database/auth";
import { Unit } from "true-myth";
import Result, { ok } from "true-myth/result";
import { addOrganizationAction, dropOrganizationAction } from "./actions";

export const addOrganization = async (
  name: string,
): Promise<Result<KeyedOrganization, string>> =>
  toResult(
    await addOrganizationAction({
      name,
      description: "",
      contact: "",
      howToReference: "",
    }),
  );

export const dropOrganization = async (
  key: string,
): Promise<Result<Unit, string>> =>
  toResult(await dropOrganizationAction(key)).andThen(() => ok());
