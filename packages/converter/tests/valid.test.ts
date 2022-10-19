import { describe } from "node:test";
import { it } from "./utils";

const BASE_PATH: string = "tests/valid";

describe("valid", () => {
  it("simple-argon", BASE_PATH);
  it("attachment", BASE_PATH);
});
