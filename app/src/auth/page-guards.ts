// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Session } from "next-auth";

export const userIsAuthor = (session: Session | null): session is Session => {
  if (session !== null && session.user.roles?.includes("author")) {
    return true;
  }
  return false;
};
