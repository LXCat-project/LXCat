import { join } from "path";
import { generateJsonSchemaFromType } from "@lxcat/schema/dist/core/generate_schema";

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

export const StateIndbAsJsonSchema = generateJsonSchemaFromType(
  collectionsPath,
  "State"
);

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
