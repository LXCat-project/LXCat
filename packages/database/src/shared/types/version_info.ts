// SPDX-FileCopyrightText: LXCat developer team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Valid transitions:
 * * published
 * * draft -> published + published -> archived (draft of published set gets published and published set gets archived)
 * * published -> retracted
 */
export type Status = "draft" | "published" | "archived" | "retracted";

// Used in database collection to store version info about document
export interface VersionInfo {
  status: Status;
  version: string; // The version of this document
  createdOn: string; // Date on which document was created. as ISO8601 formatted string
  commitMessage?: string; // Description of what was changed since previous version.
  retractMessage?: string; // Description why item was retracted.
}
