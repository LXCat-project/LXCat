import { number, object, ZodTypeAny } from "zod";

export const SpeciesBase = <CompositionSchema extends ZodTypeAny>(
  composition: CompositionSchema,
) =>
  object({
    composition,
    charge: number().int(),
  });
