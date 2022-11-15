// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { createGenerator, Config } from "ts-json-schema-generator";

// TODO: The "expose" attribute is currently set to "none". However it should ideally be set to "export" or "all". The problem is that when one of these values is set, the generator will still use a top-level reference (even though "topRef" is set to false). This is problematic for the database collection schemas as ArangoDB does not (yet) support top-level references.
// TODO: This might be inefficient as `createGenerator` is called separately for every invocation of `generateJsonSchemaFromType`. Find out whether this is an issue and if so, split generator creation from schema creation.
export function generateJsonSchemaFromType(path: string, typeName: string) {
  // TODO ts-json-schema-generator needs tsconfig, depending on deployment it can be somewhere,
  // code below is very hacky and should be improved
  const tsconfig = "tsconfig.json";
  const config: Config = {
    tsconfig,
    expose: "none",
    topRef: false,
    path,
  };
  return createGenerator(config).createSchema(typeName);
}
