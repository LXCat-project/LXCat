import { State } from "@lxcat/database/dist/shared/types/collections";
import { Reaction, ReactionEntry } from "@lxcat/schema/dist/core/reaction";

import "katex/dist/katex.min.css";
// @ts-ignore
import { InlineMath } from "react-katex";

function stateEntry(entry: ReactionEntry<State>) {
  if (entry.count === 1) {
    return entry.state.latex;
  }
  return `${entry.count}${entry.state.latex}`;
}

export const ReactionSummary = (props: Reaction<State>) => {
  const label = reactionLabel(props);
  return <InlineMath>{label}</InlineMath>;
};

export function reactionLabel(props: Reaction<State>) {
  const lhs = props.lhs.map(stateEntry).join(" + ");
  const rhs = props.rhs.map(stateEntry).join(" + ");
  const arrow = props.reversible ? "\\leftrightarrow" : "\\rightarrow";

  return `${lhs} ${arrow} ${rhs}`;
}
