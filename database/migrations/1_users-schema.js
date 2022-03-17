const migration = {
  async collections() {
    return ['users']
  },
  async up(db, step) {
    await step(async () => {
      const rule = {
        "properties": {
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "image": {
            "type": "string"
          },
          "emailVerified": {
            "type": "string"
          },
          "accounts": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string"
                },
                "provider": {
                  "type": "string"
                },
                "providerAccountId": {
                  "type": "string"
                },
                "refresh_token": {
                  "type": "string"
                },
                "access_token": {
                  "type": "string"
                },
                "token_type": {
                  "type": "string"
                },
                "scope": {
                  "type": "string"
                },
                "id_token": {
                  "type": "string"
                },
                "session_state": {
                  "type": "string"
                },
                "oauth_token_secret": {
                  "type": "string"
                },
                "oauth_token": {
                  "type": "string"
                }
              },
              required: ["type", "provider", "providerAccountId"],
              additionalProperties: false
            }
          },
          "sessions": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "expires": { "type": "string" },
                "sessionToken": { "type": "string" }
              },
              required: ["sessionToken", "expires"],
              additionalProperties: false
            }
          }
        },
        additionalProperties: false
      }
      const schema = {
        rule
      };
      return await db.collection('users').properties({ schema })
    })
  }
}
module.exports = migration