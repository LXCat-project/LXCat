import { Database } from "arangojs";

let _db: Database | undefined = undefined;

export function db() {
  if (_db === undefined) {
    return setDb(
      process.env.ARANGO_URL || "http://localhost:8529",
      process.env.ARANGO_PASSWORD,
      process.env.ARANGO_USERNAME || "root",
      process.env.ARANGO_DB
    );
  }

  return _db;
}

export const setDb = (
  url: string,
  password: string | undefined,
  username = "root",
  databaseName = "lxcat"
) => {
  _db = new Database({
    url,
    databaseName,
    auth: {
      username,
      password,
    },
  });
  return _db;
};
