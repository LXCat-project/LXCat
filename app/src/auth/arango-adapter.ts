// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LXCatDatabase } from "@lxcat/database";
import {
  Account,
  Session,
  SessionDiff,
  UserDiff,
  UserInDb,
  UserWithAccountSessionInDb,
} from "@lxcat/database/auth";
import { Adapter, AdapterUser } from "next-auth/adapters";

export const ArangoAdapter = (db: LXCatDatabase): Adapter => {
  function toAdapterUser(profile: UserInDb | undefined): AdapterUser | null {
    if (profile === undefined || profile._key === undefined) {
      return null;
    }
    // ArangoDB does not return Date object so convert from iso960 formatted string if set
    const emailVerified = profile.emailVerified
      ? new Date(profile.emailVerified)
      : null;
    const { _key, ...user } = {
      id: profile._key,
      ...profile,
      emailVerified,
    };
    return user;
  }
  return {
    async createUser(user: unknown) {
      const profile = UserWithAccountSessionInDb.parse(user);
      const id = await db.addUser(profile);
      const newUser = { ...profile, id: id! };
      return newUser;
    },
    getUser: async (id) => toAdapterUser(await db.getUserByKey(id)),
    getUserByEmail: async (email: string) =>
      toAdapterUser(await db.getUserByEmail(email)),
    getUserByAccount: async ({ provider, providerAccountId }) =>
      toAdapterUser(await db.getUserByAccount(provider, providerAccountId)),
    async updateUser(user) {
      const profile = UserDiff.parse({ _key: user.id, ...user });
      return toAdapterUser(await db.updateUser(profile))!;
    },
    deleteUser: async (id) => db.dropUser(id),
    async linkAccount(data: any) {
      const { userId, ...account } = data;
      const prunedAccount = Account.parse(account); // Removes extra keys
      await db.linkAccount(userId, prunedAccount);
      return data;
    },
    unlinkAccount: async (
      { providerAccountId, provider }: {
        providerAccountId: string;
        provider: string;
      },
    ) => db.unlinkAccount(provider, providerAccountId),
    async createSession(s) {
      const { sessionToken, userId, expires } = s;
      const session = Session.parse({
        sessionToken,
        expires: expires.toISOString(),
      });
      await db.addSession(userId, session);
      return s;
    },
    async getSessionAndUser(sessionToken) {
      try {
        const session_user = await db.getSessionAndUser(sessionToken);
        if (session_user === undefined) {
          throw new Error("Session not found");
        }
        const user = toAdapterUser(session_user.user);
        if (!user) {
          throw new Error("User not found");
        }
        const session = {
          sessionToken: session_user.session.sessionToken,
          // ArangoDB stores dates as string, but next-auth expects Date object
          expires: new Date(session_user.session.expires),
          userId: user.id,
        };
        return { session, user };
      } catch (error) {
        console.error(`Session and user for ${sessionToken} not found`);
        return null;
      }
    },
    async updateSession(session) {
      const parsedSession = SessionDiff.parse(session);
      const { sessionToken } = session;
      try {
        const sessionAndUserId = await db.updateSession(parsedSession);
        if (!sessionAndUserId) {
          throw new Error("Session not found");
        }
        return {
          ...sessionAndUserId.session,
          expires: new Date(sessionAndUserId.session.expires),
          userId: sessionAndUserId.userId,
          id: sessionToken,
        };
      } catch (error) {
        console.error(`Session ${sessionToken} not found`);
        return null;
      }
    },
    async deleteSession(sessionToken) {
      try {
        await db.dropSession(sessionToken);
      } catch (error) {
        console.error(`Session ${sessionToken} not found`);
        return null;
      }
    },
  };
};
