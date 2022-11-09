// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import type {
  User as LocalUser,
  Session as LocalSession,
} from "@lxcat/database/dist/auth/schema";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  type User = LocalUser;

  interface Session extends LocalSession {
    user: User;
  }
}
