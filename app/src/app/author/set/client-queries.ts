// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { KeyedSet } from "@lxcat/database/set";
import { Result } from "true-myth";
import { err, ok } from "true-myth/result";

/**
 * Functions that interact with API endpoints
 */

const headers = new Headers({
  Accept: "application/json",
  "Content-Type": "application/json",
});

export async function deleteSet(
  key: string,
  message: string,
): Promise<Result<any, string>> {
  const url = `/api/author/set/${key}`;
  const body = JSON.stringify({ message: message });
  const init = { method: "DELETE", body, headers };
  const res = await fetch(url, init);

  if (res.status === 200) {
    return ok(await res.json());
  } else {
    return err(await res.text());
  }
}

export async function publishSet(
  selectedSetId: string,
): Promise<Result<any, string>> {
  const url = `/api/author/set/${selectedSetId}/publish`;
  const init = { method: "POST", headers };
  const res = await fetch(url, init);

  if (res.status === 200) {
    return ok(await res.json());
  } else {
    return err(await res.text());
  }
}

export async function listSetsOfOwner(): Promise<Array<KeyedSet>> {
  const url = "/api/author/set";
  const init = { headers };
  const res = await fetch(url, init);
  const data = await res.json();
  return data.items as KeyedSet[];
}
