import "dotenv/config";
import { db } from "./db";
import { systemDb } from "./systemDb";

(async () => {
  try {
    await systemDb().dropDatabase(db().name);
  } catch (err) {
    console.error(err);
  }
})();
