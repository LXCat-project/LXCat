import 'dotenv/config'
import { aql } from "arangojs";
import { db } from '../../app/src/db'

(async () => {
    try {
        const email = process.argv[2]
        const role = 'admin'
        db.query(aql`
            FOR u IN users
                FILTER u.email == ${email}
            UPDATE u WITH {
                roles: PUSH(u.roles, ${role}, true)
            } IN users
        `)
    } catch (err) {
        console.error(err);
    }
})()
