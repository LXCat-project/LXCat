import { Role, UserFromDB } from "@lxcat/database/auth";
import { Result, Unit } from "true-myth";
import { err, ok } from "true-myth/result";

export const updateRole = async (
  user: UserFromDB,
  role: Role,
): Promise<Result<Array<Role>, string>> => {
  const url = `/api/users/${user._key}/roles/${role}`;
  const res = await fetch(url, {
    method: "POST",
  });

  if (res.ok) {
    return ok(await res.json());
  } else {
    return err(await res.text());
  }
};
export const deleteUser = async (
  user: UserFromDB,
): Promise<Result<Unit, string>> => {
  const url = `/api/users/${user._key}`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (res.ok) {
    return ok();
  } else {
    return err(await res.text());
  }
};
export const updateOrganization = async (
  user: UserFromDB,
  organizationKeys: string[],
): Promise<Result<Array<string>, string>> => {
  const url = `/api/users/${user._key}/organizations`;
  const body = JSON.stringify(organizationKeys);
  const headers = {
    "Content-Type": "application/json",
  };
  const res = await fetch(url, {
    method: "POST",
    body,
    headers,
  });
  if (res.ok) {
    return ok(organizationKeys);
  } else {
    return err(await res.text());
  }
};
