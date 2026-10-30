// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * The contributor has to be one of the organizations that the user can pick,
 * as a select shows its first option when its value matches none of them.
 */
export const emptySet = (contributor = "") => (
  {
    name: "",
    contributor,
    description: "",
    complete: false,
    references: {},
    states: {},
    processes: [],
  }
);
