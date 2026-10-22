// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { toResult } from "@/shared/action-result";
import Result, { err } from "true-myth/result";
import { createSetAction } from "../actions";

export const uploadCS = async (
  doc: any,
): Promise<Result<string, Array<string>>> => {
  let parsedDoc;

  try {
    parsedDoc = JSON.parse(doc);
  } catch {
    return err(["Invalid JSON."]);
  }

  return toResult(await createSetAction(parsedDoc, "Initial upload.")).map(
    ({ id }) => id,
  );
};
