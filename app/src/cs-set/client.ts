// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { KeyedDocument } from "@lxcat/database/schema";
import { KeyedSet } from "@lxcat/database/set";

/**
 * Functions that interact with API endpoints
 */

const headers = new Headers({
  Accept: "application/json",
  "Content-Type": "application/json",
});

export async function deleteSet(key: string, message?: string) {
  const url = `/api/author/scat-css/${key}`;
  const body = JSON.stringify({ message: message });
  const init = { method: "DELETE", body, headers };
  const res = await fetch(url, init);

  // TODO: Use a library like true-myth for error handling.
  if (res.status === 200) {
    return res.json();
  } else {
    return res.text();
  }
}

export async function publishSet(selectedSetId: string) {
  const url = `/api/author/scat-css/${selectedSetId}/publish`;
  const init = { method: "POST", headers };
  const res = await fetch(url, init);

  // TODO: Use a library like true-myth for error handling.
  if (res.status === 200) {
    return res.json();
  } else {
    return res.text();
  }
}

export async function listSetsOfOwner(): Promise<Array<KeyedSet>> {
  const url = "/api/author/scat-css";
  const init = { headers };
  const res = await fetch(url, init);
  const data = await res.json();
  return data.items as KeyedSet[];
}
