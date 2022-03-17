require('dotenv').config()

module.exports = {
  dbConfig: {
    databaseName: process.env.ARANGO_NAME || 'lxcat',
    url: process.env.ARANGO_URL || 'http://localhost:8529',
    auth: {
      username: process.env.ARANGO_USERNAME || 'root',
      password: process.env.ARANGO_ROOT_PASSWORD
    }
  },
  migrationsPath: './migrations'
}
