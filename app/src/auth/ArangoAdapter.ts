import { aql, Database } from "arangojs";
import { Adapter, AdapterUser } from "next-auth/adapters";

export const ArangoAdapter = (db: Database): Adapter => {
    return {
        async createUser(user) {
            const result = await db.query(aql`
                INSERT ${user} INTO users LET r = NEW RETURN r._key
            `)
            const id = await result.next()
            return {...user, id} as AdapterUser
        },
        async getUser(id) {
            const result = await db.query(aql`
                FOR u IN users
                    FILTER u._key == ${id}
                    RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
            `)
            const user = await result.next()
            return user
        },
        async getUserByEmail(email) {
            const result = await db.query(aql`
                FOR u IN users
                    FILTER u.email == ${email}
                    RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
            `)
            const user = await result.next()
            return user
        },
        async getUserByAccount({ provider, providerAccountId}) {
            const result = await db.query(aql`
                FOR u IN users
                    FOR a IN u.accounts
                        FILTER
                            a.provider == ${provider}
                            AND a.providerAccountId == ${providerAccountId}
                RETURN UNSET(u, ["_id", "_rev", "accounts", "sessions"])
            `)
            const user = await result.next()
            return user
        },
        async updateUser(user) {
            const result = await db.query(aql`
                UPDATE {_key: ${user.id}} WITH ${user} IN users
            `)
            const id = await result.next()
            return {...user, id} as AdapterUser
        },
        async deleteUser(userId) {
            await db.query(aql`
                DELETE { _key: ${userId}} IN users
            `)
        },
        async linkAccount({userId, ...account}) {
            await db.query(aql`
                FOR u IN users
                    FILTER u._key == ${userId}
                UPDATE u WITH {
                    accounts: PUSH(u.accounts, ${account})
                } IN users
            `)
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
                `)
            return
        },
        async createSession({ sessionToken, userId, expires }) {
            const session = {sessionToken, expires}
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
            const result = await db.query(aql`
                FOR u IN users
                    FOR s IN sessions
                        FILTER s.sessionToken == ${sessionToken}
                RETURN s
            `)
            const session = await result.next()
            return session
        },
        async updateSession(session) {
            const {sessionToken} = session
            const result = await db.query(aql`
                FOR u IN users
                    FOR s IN u.sessions
                        FILTER s.sessionToken == ${sessionToken}
                UPDATE u WITH {
                    sessions: PUSH(REMOVE_VALUE(u.sessions, s), ${session})
                } IN users
                RETURN s
                `)
            return await result.next()
        },
        async deleteSession(sessionToken) {
            await db.query(aql`
                FOR u IN users
                    FOR s IN u.sessions
                        FILTER s.sessionToken == ${sessionToken}
                UPDATE u WITH {
                    sessions: PUSH(REMOVE_VALUE(u.sessions, s)
                } IN users
                `)
            return
        }
    }
}
