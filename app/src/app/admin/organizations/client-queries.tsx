// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { KeyedOrganization } from "@lxcat/database/auth";
import { Unit } from "true-myth";
import Result, { err, ok } from "true-myth/result";

const headers = new Headers({
  Accept: "application/json",
  "Content-Type": "application/json",
});

export const addOrganization = async (
  name: string,
): Promise<Result<KeyedOrganization, string>> => {
  const url = "/api/organizations";
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: name,
      description: "",
      contact: "",
      howToReference: "",
    }),
  });

  if (res.ok) {
    return ok(KeyedOrganization.parse(await res.json()));
  } else {
    return err(await res.text());
  }
};

export const dropOrganization = async (
  key: string,
): Promise<Result<Unit, string>> => {
  const url = `/api/organizations/${key}`;
  const res = await fetch(url, { method: "DELETE", headers });

  if (res.ok) {
    return ok();
  } else {
    return err(await res.text());
  }
};
