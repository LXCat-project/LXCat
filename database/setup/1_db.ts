import 'dotenv/config'
import { systemDb } from '../src/systemDb';

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

(async () => {
    const db = systemDb()

    const names = await db.listDatabases();
    const databaseName = process.env.ARANGO_NAME || 'lxcat'
    if (!(names.includes(databaseName))) {
        console.log('Database created')
        await db.createDatabase(databaseName)
        // Database is not immediately usable so sleep for 2 seconds
        await delay(2000)
    } else {
        console.log('Database already exists')
    }
})();
