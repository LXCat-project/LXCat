import 'dotenv/config'
import { db } from '../../../app/src/db'
import { User } from '../../../app/src/auth/schema'

(async () => {
    const users = db.collection<User>('users')
    const newUser = await users.save({
        name: 'somename',
        email: 'somename@example.com'
    }, {
        returnNew: true
    })
    console.log(`Test user added with _key = ${newUser._key}`)
})();
