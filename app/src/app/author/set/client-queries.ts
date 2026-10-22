// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { toResult } from "@/shared/action-result";
import { Result } from "true-myth";
import { deleteSetAction, publishSetAction } from "./actions";

/**
 * Functions that interact with the author server actions.
 */

export async function deleteSet(
  key: string,
  message: string,
): Promise<Result<any, string>> {
  return toResult(await deleteSetAction(key, message)).mapErr((messages) =>
    messages.join("\n")
  );
}

export async function publishSet(
  selectedSetId: string,
): Promise<Result<any, string>> {
  return toResult(await publishSetAction(selectedSetId)).mapErr((messages) =>
    messages.join("\n")
  );
}
