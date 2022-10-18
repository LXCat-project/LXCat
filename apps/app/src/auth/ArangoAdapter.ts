import { aql, Database } from "arangojs";
import { ArrayCursor } from "arangojs/cursor";
import { Adapter, AdapterUser } from "next-auth/adapters";
import {
  dropUser as deleteUser,
  getUserByKey,
} from "@lxcat/database/dist/auth/queries";
import {
  Account,
  Session,
  User,
  UserInDb,
  UserWithAccountSessionInDb,
} from "@lxcat/database/dist/auth/schema";

export const ArangoAdapter = (db: Database): Adapter => {
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
    async createUser(user) {
      const profile = UserWithAccountSessionInDb.parse(user);
      const result = await db.query(aql`
                INSERT ${profile} INTO users LET r = NEW RETURN r._key
            `);
      const id: string = await result.next();
      const newUser: AdapterUser = { ...user, id };
      return newUser;
    },
    async getUser(id) {
      const user = await getUserByKey(id);
      return toAdapterUser(user);
    },
    async getUserByEmail(email) {
      const cursor: ArrayCursor<UserInDb> = await db.query(aql`
                FOR u IN users
                    FILTER u.email == ${email}
                    RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
            `);
      const user = await cursor.next();
      return toAdapterUser(user);
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const cursor: ArrayCursor<UserInDb> = await db.query(aql`
                FOR u IN users
                    FOR a IN u.accounts
                        FILTER
                            a.provider == ${provider}
                            AND a.providerAccountId == ${providerAccountId}
                RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
            `);
      const user = await cursor.next();
      return toAdapterUser(user);
    },
    async updateUser(user) {
      const partialUser = { _key: user.id, ...user };
      const profile = User.partial().parse(partialUser);
      const cursor: ArrayCursor<UserInDb> = await db.query(aql`
                FOR u IN users
                    FILTER u._key == ${user.id}
                UPDATE u WITH ${profile} IN users
                LET updated = NEW
                RETURN UNSET(updated, ["_id", "_rev", "accounts", "sessions"])
            `);
      const updatedUser = await cursor.next();
      return toAdapterUser(updatedUser)!;
    },
    deleteUser,
    async linkAccount(data) {
      const { userId, ...account } = data;
      const prunedAccount = Account.parse(account); // Removes extra keys
      await db.query(aql`
                FOR u IN users
                    FILTER u._key == ${userId}
                UPDATE u WITH {
                    accounts: PUSH(u.accounts, ${prunedAccount}, true)
                } IN users
            `);
      return data;
    },
    async unlinkAccount({ providerAccountId, provider }) {
      await db.query(aql`
                FOR u IN users
                    FOR a IN u.accounts
                        FILTER a.provider == ${provider}
                            AND a.providerAccountId == ${providerAccountId}
                UPDATE u WITH {
                    accounts: REMOVE_VALUE(u.accounts, a)
                } IN users
                `);
    },
    async createSession(s) {
      const { sessionToken, userId, expires } = s;
      const session = Session.parse({
        sessionToken,
        expires: expires.toISOString(),
      });
      await db.query(aql`
                FOR u IN users
                    FILTER u._key == ${userId}
                UPDATE u WITH {
                    sessions: PUSH(u.sessions, ${session}, true)
                } IN users
            `);
      return { ...s, id: sessionToken };
    },
    async getSessionAndUser(sessionToken) {
      try {
        const cursor: ArrayCursor<{ session: Session; user: UserInDb }> =
          await db.query(aql`
                    FOR u IN users
                        FOR s IN u.sessions
                            FILTER s.sessionToken == ${sessionToken}
                    RETURN {session: s, user: UNSET(u, ["_id", "_rev", "accounts", "sessions"])}
                `);
        const session_user = await cursor.next();
        if (session_user === undefined) {
          throw new Error("Session not found");
        }
        const user = toAdapterUser(session_user.user);
        if (!user) {
          throw new Error("User not found");
        }
        const session = {
          ...session_user.session,
          // ArangoDB stores dates as string, but next-auth expects Date object
          expires: new Date(session_user.session.expires),
          userId: user.id,
          id: sessionToken, // Dont have id for session in database because its part of bigger user document, so fake it
        };
        return { session, user };
      } catch (error) {
        console.error(`Session and user for ${sessionToken} not found`);
        return null;
      }
    },
    async updateSession(session) {
      const parsedSession = Session.partial().parse(session);
      const { sessionToken } = session;
      try {
        const result: ArrayCursor<{ userId: string; session: Session }> =
          await db.query(aql`
                    FOR u IN users
                        FOR s IN u.sessions
                            FILTER s.sessionToken == ${sessionToken}
                    UPDATE u WITH {
                        sessions: PUSH(REMOVE_VALUE(u.sessions, s), ${parsedSession})
                    } IN users
                    LET updated = NEW
                    RETURN {session: LAST(updated.session), userId: update._key}
                    `);
        const sessionAndUserId = await result.next();
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
        await db.query(aql`
                    FOR u IN users
                        FOR s IN u.sessions
                            FILTER s.sessionToken == ${sessionToken}
                            UPDATE u WITH {
                                sessions: REMOVE_VALUE(u.sessions, s)
                            } IN users
                `);
      } catch (error) {
        console.error(`Session ${sessionToken} not found`);
        return null;
      }
    },
  };
};
