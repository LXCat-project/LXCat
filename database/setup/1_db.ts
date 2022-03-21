import 'dotenv/config'
import { Database } from "arangojs";

(async () => {
    // Do not use `db` from app as it will error trying to connect to non-existing db
    const db = new Database({
        url: process.env.ARANGO_URL || 'http://localhost:8529',
        auth: {
          username: process.env.ARANGO_USERNAME || 'root',
          password: process.env.ARANGO_ROOT_PASSWORD
        }
    })

    const names = await db.listDatabases();
    const databaseName = process.env.ARANGO_NAME || 'lxcat'
    if (!(names.includes(databaseName))) {
        console.log('Database created')
        await db.createDatabase(databaseName)
    } else {
        console.log('Database already exists')
    }
})();