// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import z from "zod";
// import { CSLData } from "../common/csl/data.js";
// import { CSLDateVariable } from "../common/csl/date-variable.js";
// import { CSLNameVariable } from "../common/csl/name-variable.js";
// import { Key } from "../key.js";
import { NewLTPDocument } from "../new-document.js";
// import { AnySpecies, Composition, Element } from "../species/index.js";
// import { VersionInfo } from "../version-info.js";
import { VersionedLTPDocument } from "../versioned-document.js";

export const VersionedLTPDocumentJSONSchema = z.toJSONSchema(
  VersionedLTPDocument,
);

// export const VersionedLTPDocumentJSONSchema = zodToJsonSchema(
//   VersionedLTPDocument,
//   {
//     definitions: {
//       Key,
//       VersionInfo,
//       CSLData,
//       CSLNameVariable,
//       CSLDateVariable,
//       Element,
//       Composition,
//       AnySpecies,
//       ...Object.fromEntries(AnySpecies.optionsMap),
//     },
//     $refStrategy: "root",
//   },
// );

export const NewLTPDocumentJSONSchema = z.toJSONSchema(NewLTPDocument);

// export const NewLTPDocumentJSONSchema = zodToJsonSchema(NewLTPDocument, {
//   definitions: {
//     Key,
//     VersionInfo,
//     CSLData,
//     CSLNameVariable,
//     CSLDateVariable,
//     Element,
//     Composition,
//     AnySpecies,
//     ...Object.fromEntries(AnySpecies.optionsMap),
//   },
//   $refStrategy: "root",
// });
