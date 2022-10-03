import { State } from "@lxcat/database/dist/shared/types/collections";
import { Reaction, ReactionEntry } from "@lxcat/schema/dist/core/reaction";

function stateEntry(entry: ReactionEntry<State>) {
  if (entry.count === 1) {
    return entry.state.id;
  }
  return entry.count + " " + entry.state.id;
}

export const ReactionSummary = (props: Reaction<State>) => {
  const label = reactionLabel(props);
  return <div>{label}</div>;
};

export function reactionLabel(props: Reaction<State>) {
  const lhs = props.lhs.map(stateEntry).join(" + ");
  const rhs = props.rhs.map(stateEntry).join(" + ");
  const arrow = props.reversible ? "⇋" : "➙";
  const label = `${lhs} ${arrow} ${rhs}`;
  return label;
}
