// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { Role } from "@lxcat/database/auth";
import { EditedLTPDocument } from "@lxcat/schema";
import { Result } from "true-myth";
import { err, ok } from "true-myth/result";

/**
 * Operations on the cross section sets of an author. They are shared by the
 * REST API (token authentication) and the server actions of the website
 * (session authentication). Callers are responsible for authenticating the
 * user and validating the arguments.
 */

export type SetUser = { email: string; roles: Array<Role> };

/** `json` and `body` mirror the options of the API response helpers. */
export type SetOperationError =
  & { status: 400 | 403 | 404 }
  & (
    | { json: Array<string> }
    | { body: string }
  );

export type SetOperationResult<T> = Result<T, SetOperationError>;

export async function createSet(
  user: SetUser,
  doc: EditedLTPDocument,
  message: string,
): Promise<SetOperationResult<{ id: string }>> {
  const affiliations = await db()
    .getAffiliations(user.email)
    .then((affiliations) => affiliations.map(({ name }) => name));

  if (!affiliations.includes(doc.contributor)) {
    return err({
      status: 403,
      json: [`You are not a member of the ${doc.contributor} organization.`],
    });
  }

  try {
    return ok({ id: await db().createSet(doc, "draft", 1, message) });
  } catch (error: any) {
    if (error.errorNum === 1210) {
      return err({
        status: 400,
        json: [
          `A dataset with name ${doc.name} already exists for ${doc.contributor}.`,
        ],
      });
    }
    return err({ status: 400, json: [error.message] });
  }
}

export async function updateSet(
  user: SetUser,
  id: string,
  doc: EditedLTPDocument,
  message: string,
): Promise<SetOperationResult<{ id: string }>> {
  if (!(await db().isOwnerOfSet(id, user.email))) {
    // TODO distinguish between not owned by or does not exist
    return err({
      status: 403,
      json: [`You are not a member of the ${doc.contributor} organization.`],
    });
  }

  if (doc.contributor !== await db().getSetAffiliation(id)) {
    return err({
      status: 400,
      json: ["The contributor of an existing set cannot be changed."],
    });
  }

  try {
    return ok({ id: await db().updateSet(id, doc, message) });
  } catch (error: any) {
    console.error(error);
    return err({ status: 400, json: [error.message] });
  }
}

export async function deleteSet(
  user: SetUser,
  id: string,
  message: string,
): Promise<SetOperationResult<{ id: string }>> {
  const versionInfo = await db().getSetVersionInfo(id);

  if (versionInfo === undefined) {
    return err({ status: 404, body: `Item with id ${id} does not exist.` });
  }

  if (!(await db().isOwnerOfSet(id, user.email))) {
    return err({
      status: 403,
      body: "This cross section set is not owned by you.",
    });
  }

  if (versionInfo.status === "draft" && user.roles.includes("author")) {
    await db().removeDraftSetUnchecked(id);
  } else if (
    versionInfo.status === "published" && user.roles.includes("publisher")
  ) {
    await db().retractSetUnchecked(id, message);
  } else {
    return err({
      status: 403,
      body:
        `You are not allowed to remove a ${versionInfo.status} cross section set.`,
    });
  }

  return ok({ id });
}

export async function publishSet(
  user: SetUser,
  id: string,
): Promise<SetOperationResult<{ id: string }>> {
  if (!(await db().isOwnerOfSet(id, user.email))) {
    // TODO distinguish between not owned by or does not exist
    return err({
      status: 403,
      body: "This cross section set is not owned by you.",
    });
  }

  await db().publishSet(id);
  return ok({ id });
}

export const listOwnedSets = (user: SetUser) => db().listOwnedSets(user.email);
