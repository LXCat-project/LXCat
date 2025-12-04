// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { enum as zodEnum, iso, number, object, output, string } from "zod";
import { registerType } from "./common/util.js";

/**
 * Valid transitions:
 * * published
 * * draft -> published + published -> archived (draft of published set gets published and published set gets archived)
 * * published -> retracted
 */
export const Status = zodEnum(["draft", "published", "archived", "retracted"])
  .describe("The status of the versioned document.");
export type Status = output<typeof Status>;

// TODO: Is there a need for more advanced versioning, e.g. semantic versioning
//       for data items and sets?
// Used to store version information about versioned documents.
export const VersionInfo = object({
  version: number().int().positive(),
  createdOn: iso.datetime(),
  status: Status,
  commitMessage: string().min(1).optional().describe(
    "Description of what was changed since the previous version.",
  ),
  retractMessage: string().min(1).optional().describe(
    "Description of why the item was retracted.",
  ),
});
export type VersionInfo = output<typeof VersionInfo>;

registerType(VersionInfo, { id: "VersionInfo" });
