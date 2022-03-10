import { Database } from "arangojs";

export const db = new Database({
    url: process.env.ARANGO_URL ?? '',
    databaseName: process.env.ARANGO_DB ?? 'lxcat',
    auth: {
        username: process.env.ARANGO_USERNAME ?? 'root',
        password: process.env.ARANGO_PASSWORD
    }
})
