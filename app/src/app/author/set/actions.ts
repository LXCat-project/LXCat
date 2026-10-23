// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use server";

import { requireAuthor, requirePublisher } from "@/auth/action-guards";
import {
  createSet,
  deleteSet,
  listOwnedSets,
  publishSet,
  SetOperationError,
  SetOperationResult,
  updateSet,
} from "@/author/set-operations";
import { actionErr, actionOk, ActionResult } from "@/shared/action-result";
import { LXCatID } from "@/shared/lxcatid";
import { EditedLTPDocument } from "@lxcat/schema";
import { Session } from "next-auth";
import { z } from "zod";

const messageSchema = z.string().min(1);

const errorMessages = (error: SetOperationError) =>
  "json" in error ? error.json : [error.body];

const toActionResult = <T>(
  result: SetOperationResult<T>,
): ActionResult<T, Array<string>> =>
  result.isOk ? actionOk(result.value) : actionErr(errorMessages(result.error));

const sessionUser = ({ user }: Session) => ({
  email: user.email,
  roles: user.roles ?? [],
});

const parseDocument = (
  doc: unknown,
  message: unknown,
): ActionResult<{ doc: EditedLTPDocument; message: string }, Array<string>> => {
  const parsedDoc = EditedLTPDocument.safeParse(doc);
  if (!parsedDoc.success) {
    return actionErr(
      parsedDoc.error.issues.map((issue) =>
        `${issue.path.join("/")}: ${issue.message}`
      ),
    );
  }
  const parsedMessage = messageSchema.safeParse(message);
  if (!parsedMessage.success) {
    return actionErr(["A commit message is required."]);
  }
  return actionOk({ doc: parsedDoc.data, message: parsedMessage.data });
};

export async function createSetAction(
  doc: unknown,
  message: unknown,
): Promise<ActionResult<{ id: string }, Array<string>>> {
  const session = await requireAuthor();
  const parsed = parseDocument(doc, message);
  if (!parsed.ok) return parsed;
  return toActionResult(
    await createSet(
      sessionUser(session),
      parsed.value.doc,
      parsed.value.message,
    ),
  );
}

export async function updateSetAction(
  id: unknown,
  doc: unknown,
  message: unknown,
): Promise<ActionResult<{ id: string }, Array<string>>> {
  const session = await requireAuthor();
  const setId = LXCatID.parse(id);
  const parsed = parseDocument(doc, message);
  if (!parsed.ok) return parsed;
  return toActionResult(
    await updateSet(
      sessionUser(session),
      setId,
      parsed.value.doc,
      parsed.value.message,
    ),
  );
}

export async function deleteSetAction(
  id: unknown,
  message: unknown,
): Promise<ActionResult<{ id: string }, Array<string>>> {
  const session = await requireAuthor();
  return toActionResult(
    await deleteSet(
      sessionUser(session),
      LXCatID.parse(id),
      messageSchema.parse(message),
    ),
  );
}

export async function publishSetAction(
  id: unknown,
): Promise<ActionResult<{ id: string }, Array<string>>> {
  const session = await requirePublisher();
  return toActionResult(
    await publishSet(sessionUser(session), LXCatID.parse(id)),
  );
}

export async function listOwnedSetsAction() {
  const session = await requireAuthor();
  return listOwnedSets(sessionUser(session));
}
