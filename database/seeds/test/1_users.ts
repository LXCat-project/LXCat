import 'dotenv/config'
import { db } from '../../../app/src/db'
import { UserWithAccountSessionInDb } from '../../../app/src/auth/schema'

(async () => {
    const users = db.collection<UserWithAccountSessionInDb>('users')
    const user = UserWithAccountSessionInDb.parse({
        name: 'somename',
        email: 'somename@example.com'
    })
    const newUser = await users.save(user, {
        returnNew: true
    })
    console.log(`Test user added with _key = ${newUser._key}`)
})();
