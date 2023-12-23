// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { Reversible } from "@lxcat/database/item/picker";
import {
  KeyedLTPMixtureReferenceable,
  SerializedSpecies,
} from "@lxcat/database/schema";
import { Reference } from "@lxcat/schema";
import { Reaction, ReactionTypeTag } from "@lxcat/schema/process";
import { AnySpecies, StateSummary } from "@lxcat/schema/species";
import { z } from "zod";
import { registry } from "../../docs/openapi";

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

const baseStateSummarySchema = z.object({
  latex: z.string(),
  valid: z.boolean(),
});

type _StateSummary = z.infer<typeof baseStateSummarySchema> & {
  children?: Record<string, _StateSummary>;
};

export const stateSummarySchema: z.ZodType<_StateSummary> =
  baseStateSummarySchema.extend({
    children: z.lazy(() => z.record(z.string(), stateSummarySchema)).optional()
      .openapi("StateSummary", { type: "object" }),
  }).openapi("stateSummarySchema");

export const stateTreeSchema = z.record(z.string(), stateSummarySchema);

export const organizationSummarySchema = z.object({
  name: z.string(),
  sets: z.record(z.string(), z.string()),
});

export const reactionOptionsSchema = z.object({
  consumes: z.array(stateTreeSchema),
  produces: z.array(stateTreeSchema),
  typeTags: z.array(ReactionTypeTag),
  reversible: z.array(z.nativeEnum(Reversible)),
  set: z.record(z.string(), organizationSummarySchema),
});

export const searchOptionsSchema = z.array(reactionOptionsSchema);

export const crossSectionSetHeadingSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const stateLeafSchema = z.object({
  id: z.string(),
  includeChildren: z.boolean(),
});

export async function register() {
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

  registry().register(
    "KeyedLTPMixture",
    KeyedLTPMixtureReferenceable,
  );

  registry().register(
    "CrossSectionSetHeading",
    crossSectionSetHeadingSchema,
  );

  registry().register(
    "ReactionOptions",
    reactionOptionsSchema,
  );
}
