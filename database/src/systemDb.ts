import { Database } from "arangojs";

export function systemDb() {
  // Do not use `db` from app as it will error trying to connect to non-existing db
  return new Database({
    url: process.env.ARANGO_URL || "http://localhost:8529",
    auth: {
      username: process.env.ARANGO_USERNAME || "root",
      password: process.env.ARANGO_ROOT_PASSWORD,
    },
  });
}
