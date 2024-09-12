// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { Reversible } from "@lxcat/database/item/picker";
import { OwnedProcess } from "@lxcat/database/schema";
import { Reference, VersionedLTPDocumentWithReference } from "@lxcat/schema";
import { Reaction, ReactionTypeTag } from "@lxcat/schema/process";
import {
  AnySpecies,
  Composition,
  SerializedSpecies,
  StateSummary,
} from "@lxcat/schema/species";
import { z } from "zod";
import { queryJSONSchema } from "./util";

extendZodWithOpenApi(z);

export const speciesSchema = z.object({
  _id: z.string(),
  species: SerializedSpecies,
  hasChildren: z.boolean(),
}).openapi("Species");

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
}).openapi("ReactionTemplate");

export const versionInfoSchema = z.object({
  status: z.enum(["draft", "published", "archived", "retracted"]),
  version: z.string(),
  createdOn: z.string(),
  commitMessage: z.string().optional(),
  retractedMessage: z.string().optional(),
});

export const crossSectionSetHeadingSchema = z.object({
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
    crossSectionSetHeadingSchema.omit({ publishedIn: true }).and(
      z.object({ id: z.string(), publishedIn: Reference.optional() }),
    ),
  ),
  reaction: Reaction(
    z.object({ detailed: AnySpecies, serialized: StateSummary }),
  ),
  reference: z.array(Reference),
}).openapi("CrossSectionHeading");

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
}).openapi("ReactionOptions");

export const searchOptionsSchema = z.array(reactionOptionsSchema);

export const crossSectionSetReferenceSchema = z.object({
  id: z.string(),
  name: z.string(),
}).openapi("CrossSectionSetReference");

export const stateLeafSchema = z.object({
  id: z.string(),
  includeChildren: z.boolean(),
});

export const reactionQuerySchema = z.object({
  consumes: queryJSONSchema(z.array(stateLeafSchema)),
  produces: queryJSONSchema(z.array(stateLeafSchema)),
  reversible: z.nativeEnum(Reversible).default(Reversible.Both),
  typeTags: queryJSONSchema(z.array(ReactionTypeTag)),
  setIds: queryJSONSchema(z.array(z.string())),
});

export async function register() {
  (Composition._def as any).type._def.items[0].options[1]._def.openapi = {
    _internal: { refId: "Composition" },
    metadata: { type: "object" },
  };
  AnySpecies._def.openapi = { _internal: { refId: "AnySpecies" } };
  VersionedLTPDocumentWithReference._def.openapi = {
    _internal: { refId: "VersionedLTPDocumentWithReference" },
  };
  ReactionTypeTag._def.openapi = { _internal: { refId: "ReactionTypeTag" } };
  OwnedProcess._def.openapi = { _internal: { refId: "OwnedProcess" } };
  ReactionTypeTag._def.openapi = { _internal: { refId: "ReactionTypeTag" } };
  Reference._def.openapi = { _internal: { refId: "Reference" } };
  SerializedSpecies._def.openapi = {
    _internal: { refId: "SerializedSpecies" },
  };
  StateSummary._def.openapi = { _internal: { refId: "StateSummary" } };
}
