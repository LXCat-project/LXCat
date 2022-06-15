import "dotenv/config";
import { join, dirname } from "path";
import { load_css_dir } from "../../src/css/loaders";

export default async function () {
  const thisfile = new URL(import.meta.url);
  const dir = join(dirname(thisfile.pathname), "crosssections");
  await load_css_dir(dir);
}
