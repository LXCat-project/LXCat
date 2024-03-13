import { object, TypeOf } from "zod";
import { AnySpecies } from "./any-species.js";
import { StateSummary } from "./summary.js";

export const SerializedSpecies = object({
  detailed: AnySpecies,
  serialized: StateSummary,
});
export type SerializedSpecies = TypeOf<typeof SerializedSpecies>;
