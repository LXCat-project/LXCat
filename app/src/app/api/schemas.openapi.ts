// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reference, VersionedLTPDocumentWithReference } from "@lxcat/schema";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { SerializedSpecies } from "@lxcat/schema/species";
import { z } from "zod";

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

export const crossSectionSetReferenceSchema = z.object({
  id: z.string(),
  name: z.string(),
});

z.globalRegistry.add(crossSectionSetReferenceSchema, {
  id: "CrossSectionSetReference",
});
z.globalRegistry.add(
  VersionedLTPDocumentWithReference,
  { id: "VersionedLTPDocumentWithReference" },
);
z.globalRegistry.add(ReactionTypeTag, { id: "ReactionTypeTag" });
z.globalRegistry.add(Reference, { id: "Reference" });
z.globalRegistry.add(SerializedSpecies, { id: "SerializedSpecies" });
