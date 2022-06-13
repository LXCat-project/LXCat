import "dotenv/config";
import { join } from "path";
import { load_css_dir } from "../../src/css/loaders";

export default async function () {
  const dir = join(__dirname, "crosssections");
  await load_css_dir(dir);
}
