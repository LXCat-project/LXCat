// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { StateSummary, StateTree } from "../../shared/queries/state";
import { NestedStateArray } from "./types";

export function stateArrayToObject({
  id,
  latex,
  valid,
  children,
}: NestedStateArray): [string, StateSummary] {
  const subtree = stateArrayToTree(children);
  const r = subtree === undefined
    ? { latex, valid }
    : { latex, valid, children: subtree };
  return [id, r];
}

export function stateArrayToTree(
  array?: Array<NestedStateArray>,
): StateTree | undefined {
  return array ? Object.fromEntries(array.map(stateArrayToObject)) : undefined;
}
