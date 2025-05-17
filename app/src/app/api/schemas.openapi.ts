// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reversible } from "@lxcat/database/item/picker";
import { OwnedProcess } from "@lxcat/database/schema";
import { Reference, VersionedLTPDocumentWithReference } from "@lxcat/schema";
import { Reaction, ReactionTypeTag } from "@lxcat/schema/process";
import {
  AnySpecies,
  SerializedSpecies,
  StateSummary,
} from "@lxcat/schema/species";
import { z } from "zod";
import { queryJSONSchema } from "./util";

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
  reversible: z.enum(Reversible),
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
});

export type StateSummarySchema = {
  latex: string;
  valid: boolean;
  children?: Record<string, StateSummarySchema>;
};

export const StateSummarySchema: z.ZodType<StateSummarySchema> = z.lazy(() =>
  z.object({
    latex: z.string(),
    valid: z.boolean(),
    children: z.record(z.string(), StateSummarySchema).optional(),
  })
);

export const stateTreeSchema = z.record(z.string(), StateSummarySchema);

export const organizationSummarySchema = z.object({
  name: z.string(),
  sets: z.record(z.string(), z.string()),
});

export const reactionOptionsSchema = z.object({
  consumes: z.array(stateTreeSchema),
  produces: z.array(stateTreeSchema),
  typeTags: z.array(ReactionTypeTag),
  reversible: z.array(z.enum(Reversible)),
  set: z.record(z.string(), organizationSummarySchema),
});

export const searchOptionsSchema = z.array(reactionOptionsSchema);

export const crossSectionSetReferenceSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const stateLeafSchema = z.object({
  id: z.string(),
  includeChildren: z.boolean(),
});

export const reactionQuerySchema = z.object({
  consumes: queryJSONSchema(z.array(stateLeafSchema)),
  produces: queryJSONSchema(z.array(stateLeafSchema)),
  reversible: z.enum(Reversible).default(Reversible.Both),
  typeTags: queryJSONSchema(z.array(ReactionTypeTag)),
  setIds: queryJSONSchema(z.array(z.string())),
});

z.globalRegistry.add(speciesSchema, { id: "Species" });
z.globalRegistry.add(reactionTemplateSchema, { id: "ReactionTemplate" });
z.globalRegistry.add(crossSectionHeadingSchema, { id: "CrossSectionHeading" });
z.globalRegistry.add(StateSummarySchema, { id: "StateSummarySchema" });
z.globalRegistry.add(reactionOptionsSchema, { id: "ReactionOptions" });
z.globalRegistry.add(crossSectionSetReferenceSchema, {
  id: "CrossSectionSetReference",
});
z.globalRegistry.add(
  VersionedLTPDocumentWithReference,
  { id: "VersionedLTPDocumentWithReference" },
);
z.globalRegistry.add(ReactionTypeTag, { id: "ReactionTypeTag" });
z.globalRegistry.add(OwnedProcess, { id: "OwnedProcess" });
z.globalRegistry.add(Reference, { id: "Reference" });
z.globalRegistry.add(SerializedSpecies, { id: "SerializedSpecies" });
