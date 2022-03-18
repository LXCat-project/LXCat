const migration = {
  async collections () {
    return ['users']
  },
  async up (db, step) {
    await step(async () => {
      const users  = db.collection('users')
      return Promise.all([
        users.ensureIndex({ type: "persistent", fields: [ "email" ], unique: true }),
        users.ensureIndex({ type: "persistent", fields: [ "accounts[*].provider", "accounts[*].providerAccountId" ], unique: true }),
        users.ensureIndex({ type: "persistent", fields: [ "session[*].sessionToken" ], unique: true }),
      ])
    })
  }
}
module.exports = migration