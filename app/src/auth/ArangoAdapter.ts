import { aql, Database } from "arangojs";
import { Adapter, AdapterUser } from "next-auth/adapters";

export const ArangoAdapter = (db: Database): Adapter => {
    return {
        async createUser(user) {
            user.accounts = []
            user.sessions = []
            if (user.emailVerified === null) {
                delete user.emailVerified
            }
            const result = await db.query(aql`
                INSERT ${user} INTO users LET r = NEW RETURN r._key
            `)
            const id = await result.next()
            return { ...user, id } as AdapterUser
        },
        async getUser(id) {
            const cursor = await db.query(aql`
                FOR u IN users
                    FILTER u._key == ${id}
                    RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
            `)
            const user = await cursor.next()
            if (user === undefined) {
                return null
            }
            if ('emailVerified' in user) {
                user.emailVerified = new Date(user.emailVerified)
            }
            return { id, ...user }
        },
        async getUserByEmail(email) {
            const cursor = await db.query(aql`
                FOR u IN users
                    FILTER u.email == ${email}
                    RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
            `)
            const result = await cursor.next()
            if (result === undefined) {
                return null
            }
            const { _key, user } = result
            if ('emailVerified' in user) {
                user.emailVerified = new Date(user.emailVerified)
            }
            return { id: _key, ...user }
        },
        async getUserByAccount({ provider, providerAccountId }) {
            const cursor = await db.query(aql`
                FOR u IN users
                    FOR a IN u.accounts
                        FILTER
                            a.provider == ${provider}
                            AND a.providerAccountId == ${providerAccountId}
                RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
            `)
            const result = await cursor.next()
            if (result === undefined) {
                return null
            }
            const { _key, ...user } = result
            if ('emailVerified' in user) {
                user.emailVerified = new Date(user.emailVerified)
            }
            return { id: _key, ...user }
        },
        async updateUser(user) {
            const result = await db.query(aql`
                UPDATE {_key: ${user.id}} WITH ${user} IN users
            `)
            const id = await result.next()
            return { ...user, id } as AdapterUser
        },
        async deleteUser(userId) {
            await db.query(aql`
                DELETE { _key: ${userId}} IN users
            `)
        },
        async linkAccount(data) {
            const { userId, ...account } = data
            await db.query(aql`
                FOR u IN users
                    FILTER u._key == ${userId}
                UPDATE u WITH {
                    accounts: PUSH(u.accounts, ${account})
                } IN users
            `)
            return data
        },
        async unlinkAccount({ providerAccountId, provider }) {
            try {
                const cursor = await db.query(aql`
                    FOR u IN users
                        FOR a IN u.accounts
                            FILTER a.provider == ${provider}
                                AND a.providerAccountId == ${providerAccountId}
                    UPDATE u WITH {
                        accounts: REMOVE_VALUE(u.accounts, a)
                    } IN users
                    RETURN a
                    `)
                return await cursor.next()
            } catch (error) {
                console.error(`Account ${providerAccountId} for provider ${provider} not found`)
                return null
            }
        },
        async createSession(s) {
            const { sessionToken, userId, expires } = s
            const session = { sessionToken, expires }
            await db.query(aql`
                FOR u IN users
                    FILTER u._key == ${userId}
                UPDATE u WITH {
                    sessions: PUSH(u.sessions, ${session})
                } IN users
            `)
            return {
                id: sessionToken,
                userId,
                ...session
            }
        },
        async getSessionAndUser(sessionToken) {
            try {
                const result = await db.query(aql`
                    FOR u IN users
                        FOR s IN u.sessions
                            FILTER s.sessionToken == ${sessionToken}
                    RETURN {session: s, user: UNSET(u, ["_id", "_rev", "accounts", "sessions"])}
                `)
                const session_user = await result.next()
                session_user.session.expires = new Date(session_user.session.expires)
                session_user.user.id = session_user.user._key
                delete session_user.user._key
                return session_user
            } catch (error) {
                console.error(`Session and user for ${sessionToken} not found`)
                return null
            }
        },
        async updateSession(session) {
            const { sessionToken } = session
            try {
                const result = await db.query(aql`
                    FOR u IN users
                        FOR s IN u.sessions
                            FILTER s.sessionToken == ${sessionToken}
                    UPDATE u WITH {
                        sessions: PUSH(REMOVE_VALUE(u.sessions, s), ${session})
                    } IN users
                    RETURN s
                    `)
                const newSession = await result.next()
                newSession.expires = new Date(newSession.expires)
                return newSession
            } catch (error) {
                console.error(`Session ${sessionToken} not found`)
                return null
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
                `)
                return
            } catch (error) {
                console.error(`Session ${sessionToken} not found`)
                return null
            }
        }
    }
}
