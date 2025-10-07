// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Result, { err, ok } from "true-myth/result";
import { ZodError } from "zod";

export const uploadCS = async (
  doc: any,
): Promise<Result<string, Array<string>>> => {
  const url = `/api/author/set`;
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  let docString;

  try {
    docString = JSON.parse(doc);
  } catch {
    return err(["Invalid JSON."]);
  }

  const init = {
    method: "POST",
    body: JSON.stringify({ doc: docString, message: "Initial upload." }),
    headers,
  };

  const res = await fetch(url, init);
  const data = await res.json();
  if (res.ok) {
    return ok(data.id);
  }

  if (data.issues) {
    // Assume error is ZodError
    return err(
      (data as ZodError).issues.map((issue) =>
        `${issue.path.slice(2).join("/")}: ${issue.message}`
      ),
    );
  } else {
    return err(data);
  }
};
