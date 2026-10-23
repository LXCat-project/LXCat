// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { toResult } from "@/shared/action-result";
import Result, { err } from "true-myth/result";
import { updateSetAction } from "../../actions";

export const uploadCS = async (
  key: string,
  docString: string,
  commitMessage: string,
): Promise<Result<string, Array<string>>> => {
  let doc;

  try {
    doc = JSON.parse(docString);
  } catch {
    return err(["Invalid JSON."]);
  }

  return toResult(await updateSetAction(key, doc, commitMessage)).map(
    ({ id }) => id,
  );
};
