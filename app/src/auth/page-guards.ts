// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Session } from "next-auth";

export const userIsAuthor = (session: Session | null): session is Session =>
  session !== null && session.user.roles?.includes("author");

export const userIsAdmin = (session: Session | null): session is Session =>
  session !== null && session.user.roles?.includes("admin");
