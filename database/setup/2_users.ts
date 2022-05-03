import 'dotenv/config'
import { db } from '../../app/src/db'
import { UserWithAccountSessionInDb, UserWithAccountSessionInDbAsJsonSchema } from '../../app/src/auth/schema'

export default async function() {
    const users = db.collection<UserWithAccountSessionInDb>('users')
    if ((await users.exists())) {
        console.log('Users collection already exists')
        return;
    }
    await users.create({
        schema: {
            rule: UserWithAccountSessionInDbAsJsonSchema
        }
    })
    await Promise.all([
        users.ensureIndex({ type: "persistent", fields: ["email"], unique: true }),
        users.ensureIndex({ type: "persistent", fields: ["accounts[*].provider", "accounts[*].providerAccountId"], unique: true }),
        users.ensureIndex({ type: "persistent", fields: ["session[*].sessionToken"], unique: true })
    ])
    console.log('Users collection created')
}
