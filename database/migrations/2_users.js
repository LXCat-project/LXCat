const migration = {
  async collections () {
    return ['users']
  },
  async up (db, step) {
    await step(async () => {
      return await db.collection('users').save({
        name: 'someone',
        email: 'someone@example.com'
      })
    })
  },
  async down(db, step) {

  }
}
module.exports = migration