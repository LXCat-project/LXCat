import 'dotenv/config'
import { aql } from "arangojs";
import { db } from '../../app/src/db'
import { Role } from '../../app/src/auth/schema'

(async () => {
    try {
        const email = process.argv[2]
        const roles = Role.options
        db.query(aql`
            FOR u IN users
                FILTER u.email == ${email}
            UPDATE u WITH {
                roles: ${roles}
            } IN users
        `)
        console.log(`${email} now all roles, including admin`)
    } catch (err) {
        console.error(err);
    }
})()
