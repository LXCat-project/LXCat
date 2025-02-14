import { readFile, writeFile } from "node:fs/promises";
import { resolveReferences } from "../css/migrate.js";

(async () => {
  const filename: string = process.argv[2];

  const file = await readFile(filename);

  const document = JSON.parse(file.toString());

  document.references = resolveReferences(document.references);

  return writeFile(filename, JSON.stringify(document));
})();
