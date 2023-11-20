import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { Reversible } from "@lxcat/database/item/picker";
import { SerializedSpecies } from "@lxcat/database/schema";
import { Reference } from "@lxcat/schema";
import { Reaction, ReactionTypeTag } from "@lxcat/schema/process";
import { z } from "zod";
import { registry } from "../../docs/openapi";
import {} from "@lxcat/schema";
import { AnySpecies, StateSummary } from "@lxcat/schema/species";

extendZodWithOpenApi(z);

export const speciesSchema = z.object({
  _id: z.string(),
  species: SerializedSpecies,
  hasChildren: z.boolean(),
});

export const reactionTemplateSchema = z.object({
  consumes: z.array(z.object({
    particle: z.string().optional(),
    electronic: z.string().optional(),
    vibrational: z.string().optional(),
    rotational: z.string().optional(),
  })),
  produces: z.array(z.object({
    particle: z.string().optional(),
    electronic: z.string().optional(),
    vibrational: z.string().optional(),
    rotational: z.string().optional(),
  })),
  reversible: z.nativeEnum(Reversible),
  typeTags: z.array(ReactionTypeTag),
  set: z.array(z.string()),
});

export const versionInfoSchema = z.object({
  status: z.enum(["draft", "published", "archived", "retracted"]),
  version: z.string(),
  createdOn: z.string(),
  commitMessage: z.string().optional(),
  retractedMessage: z.string().optional(),
});

export const crossSectionSetSchema = z.object({
  name: z.string(),
  description: z.string(),
  publishedIn: z.string().optional(),
  complete: z.boolean(),
  organization: z.string(),
  versionInfo: versionInfoSchema,
});

export const crossSectionHeadingSchema = z.object({
  id: z.string(),
  isPartOf: z.array(
    crossSectionSetSchema.omit({ publishedIn: true }).and(
      z.object({ id: z.string(), publishedIn: Reference.optional() }),
    ),
  ),
  reaction: Reaction(
    z.object({ detailed: AnySpecies, serialized: StateSummary }),
  ),
  reference: z.array(Reference),
});

export default async function() {
  registry().register(
    "Species",
    speciesSchema,
  );

  registry().register(
    "ReactionTemplate",
    reactionTemplateSchema,
  );

  registry().register(
    "CrossSectionHeading",
    crossSectionHeadingSchema,
  );
}
