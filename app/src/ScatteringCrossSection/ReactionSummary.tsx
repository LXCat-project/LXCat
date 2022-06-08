import { State } from "../shared/types/collections";
import { Reaction, ReactionEntry } from "../shared/types/reaction";

function stateEntry(entry: ReactionEntry<State>) {
  if (entry.count === 1) {
    return entry.state.id;
  }
  return entry.count + " " + entry.state.id;
}

export const ReactionSummary = (props: Reaction<State>) => {
  const lhs = props.lhs.map(stateEntry).join(" + ");
  const rhs = props.rhs.map(stateEntry).join(" + ");
  const arrow = props.reversible ? <span>&#8651;</span> : <span>&#8594;</span>;
  return (
    <div>
      {lhs} {arrow} {rhs}
    </div>
  );
};
