// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Functions that interact with API endpoints
 */

import { CrossSectionSetOwned } from "@lxcat/database/css/queries/author_read";

const headers = new Headers({
  Accept: "application/json",
  "Content-Type": "application/json",
});

export async function deleteSet(key: string, message?: string) {
  const url = `/api/author/scat-css/${key}`;
  const body = JSON.stringify({ message: message });
  const init = { method: "DELETE", body, headers };
  const res = await fetch(url, init);
  const data = await res.json();
  return data;
}

export async function publishSet(selectedSetId: string) {
  const url = `/api/author/scat-css/${selectedSetId}/publish`;
  const init = { method: "POST", headers };
  const res = await fetch(url, init);
  const data = await res.json();
  return data;
}

export async function listSetsOfOwner(): Promise<CrossSectionSetOwned[]> {
  const url = "/api/author/scat-css";
  const init = { headers };
  const res = await fetch(url, init);
  const data = await res.json();
  return data.items as CrossSectionSetOwned[];
}
