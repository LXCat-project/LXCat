import "dotenv/config";
import { systemDb } from "../src/systemDb";

export default async function () {
  const db = systemDb();

  const names = await db.listDatabases();
  const databaseName = process.env.ARANGO_NAME || "lxcat";
  if (!names.includes(databaseName)) {
    console.log(`Creating database ${databaseName}`);
    await db.createDatabase(databaseName);
  } else {
    console.log("Database already exists");
  }
}
