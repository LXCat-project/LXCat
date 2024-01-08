// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SerializedSpecies } from "@lxcat/database/schema";
import { Reaction, ReactionEntry } from "@lxcat/schema/process";

function entryAsLatex(entry: ReactionEntry<SerializedSpecies>) {
  if (entry.count === 1) {
    return entry.state.serialized.latex;
  }
  return `${entry.count}${entry.state.serialized.latex}`;
}
function entryAsText(entry: ReactionEntry<SerializedSpecies>) {
  if (entry.count === 1) {
    return entry.state.serialized.summary;
  }
  return `${entry.count}${entry.state.serialized.summary}`;
}

/**
 * Convert reaction object to a Latex string
 * @param reaction
 * @returns
 */
export function reactionAsLatex(reaction: Reaction<SerializedSpecies>) {
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
export function reactionAsText(reaction: Reaction<SerializedSpecies>) {
  const lhs = reaction.lhs.map(entryAsText).join(" + ");
  const rhs = reaction.rhs.map(entryAsText).join(" + ");
  const arrow = reaction.reversible ? "⇋" : "➙";
  return `${lhs} ${arrow} ${rhs}`;
}
