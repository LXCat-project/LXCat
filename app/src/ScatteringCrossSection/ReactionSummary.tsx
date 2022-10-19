import { State } from "@lxcat/database/dist/shared/types/collections";
import { Reaction } from "@lxcat/schema/dist/core/reaction";

import "katex/dist/katex.min.css";
// @ts-ignore
import { InlineMath } from "react-katex";
import { reactionAsLatex } from "./reaction";

export const ReactionSummary = (props: Reaction<State>) => {
  const label = reactionAsLatex(props);
  return <InlineMath>{label}</InlineMath>;
};
