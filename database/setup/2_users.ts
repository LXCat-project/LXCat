import 'dotenv/config'
import { db } from '../../app/src/db'
import { User, UserJsonSchema } from '../../app/src/auth/schema'

(async () => {
    const users = db.collection<User>('users')
    if ((await users.exists())) {
        console.log('Users collection already exists')
        return;
    }
    await users.create({
        schema: {
            rule: UserJsonSchema
        }
    })
    await Promise.all([
        users.ensureIndex({ type: "persistent", fields: ["email"], unique: true }),
        users.ensureIndex({ type: "persistent", fields: ["accounts[*].provider", "accounts[*].providerAccountId"], unique: true }),
        users.ensureIndex({ type: "persistent", fields: ["session[*].sessionToken"], unique: true })
    ])
    console.log('Users collection created')
})();
