// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getServerSession, Session } from "next-auth";
import { options } from "./options";
import {
  userIsAdmin,
  userIsAuthor,
  userIsDeveloper,
  userIsPublisher,
} from "./page-guards";

/**
 * Guards for server actions. Server actions are public POST endpoints, so
 * every action that is not meant for anonymous visitors has to call one of
 * these before touching the database.
 */

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getServerSession(options);
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session;
}

const requireRole = async (
  hasRole: (session: Session | null) => session is Session,
): Promise<Session> => {
  const session = await requireSession();
  if (!hasRole(session)) {
    throw new ForbiddenError();
  }
  return session;
};

export const requireAdmin = () => requireRole(userIsAdmin);
export const requireAuthor = () => requireRole(userIsAuthor);
export const requireDeveloper = () => requireRole(userIsDeveloper);
export const requirePublisher = () => requireRole(userIsPublisher);
