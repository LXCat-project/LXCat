import { LXCatDatabase } from "../lxcat-database.js";
import { systemDb } from "../systemDb.js";

await LXCatDatabase.create(systemDb(), "lxcat");
