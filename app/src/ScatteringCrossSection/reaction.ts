// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { State } from "@lxcat/database/dist/shared/types/collections";
import { Reaction, ReactionEntry } from "@lxcat/schema/dist/core/reaction";

function entryAsLatex(entry: ReactionEntry<State>) {
  if (entry.count === 1) {
    return entry.state.latex;
  }
  return `${entry.count}${entry.state.latex}`;
}
function entryAsText(entry: ReactionEntry<State>) {
  if (entry.count === 1) {
    return entry.state.id;
  }
  return `${entry.count}${entry.state.id}`;
}

/**
 * Convert reaction object to a Latex string
 * @param reaction
 * @returns
 */
export function reactionAsLatex(reaction: Reaction<State>) {
  const lhs = reaction.lhs.map(entryAsLatex).join(" + ");
  const rhs = reaction.rhs.map(entryAsLatex).join(" + ");
  const arrow = reaction.reversible ? "\\leftrightarrow" : "\\rightarrow";
  return `${lhs} ${arrow} ${rhs}`;
}

/**
 * Convert reaction object to a human-readable string
 * @param reaction
 * @returns
 */
export function reactionAsText(reaction: Reaction<State>) {
  const lhs = reaction.lhs.map(entryAsText).join(" + ");
  const rhs = reaction.rhs.map(entryAsText).join(" + ");
  const arrow = reaction.reversible ? "⇋" : "➙";
  return `${lhs} ${arrow} ${rhs}`;
}
