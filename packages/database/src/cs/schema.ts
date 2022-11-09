// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// TODO do edge collections need schemas?
export enum Relation {
  IsPartOf = "IsPartOf", // Between a cs and its set
  References = "References", // Between a data object and its references
}
