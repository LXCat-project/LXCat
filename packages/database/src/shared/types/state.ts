// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export type StateSummary = {
  latex: string;
  valid: boolean;
  children?: StateTree;
};
export type StateTree = Record<string, StateSummary>;
