import { join } from "path";
import { createGenerator, Config } from "ts-json-schema-generator";

// TODO: The "expose" attribute is currently set to "none". However it should ideally be set to "export" or "all". The problem is that when one of these values is set, the generator will still use a top-level reference (even though "topRef" is set to false). This is problematic for the database collection schemas as ArangoDB does not (yet) support top-level references.
export function generateJsonSchemaFromType(path: string, typeName: string) {
  // TODO ts-json-schema-generator needs tsconfig, depending on deployment it can be somewhere,
  // code below is very hacky and should be improved
  const tsconfig = join(__dirname, "..", "..", "tsconfig.json")
  const config: Config = {
    tsconfig,
    expose: "none",
    topRef: false,
    path,
  };
  return createGenerator(config).createSchema(typeName);
}

const collectionsPath = join(__dirname, "types", "collections.ts");
export const ParticleIndbAsJsonSchema = generateJsonSchemaFromType(
  collectionsPath,
  "Particle"
);

export const ContributorIndbAsJsonSchema = generateJsonSchemaFromType(
  collectionsPath,
  "Contributor"
);

export const ReferenceIndbAsJsonSchema = generateJsonSchemaFromType(
  collectionsPath,
  "Reference"
);

// TODO fix LogicError: Unexpected key type "undefined" for type "{ [key in T]?: never }" (expected "UnionType" or "StringType")
// export const StateIndbAsJsonSchema = generateJsonSchemaFromType(collectionsPath, 'State')
export const StateIndbAsJsonSchema = { type: "object" };

export const ReactionIndbAsJsonSchema = generateJsonSchemaFromType(
  collectionsPath,
  "Reaction"
);

// TODO do edge collections need schemas?
export enum Relation {
  Consumes = "Consumes", // Between a reaction and its reactants
  Produces = "Produces", // Between a reaction and its products
  HasDirectSubstate = "HasDirectSubstate", // Between a parent state and its children
  InCompound = "InCompound", // Between a state and its compounds
}
