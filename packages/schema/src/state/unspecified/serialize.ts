import { serializeSimpleParticle } from "../composition/simple/serialize";
import { StateSummary } from "../summary";
import { type Unspecified } from "./unspecified";

export const serializeUnspecified = (state: Unspecified): StateSummary => {
  const serialized = serializeSimpleParticle(state);

  serialized.summary += "{";
  serialized.latex += "\\left(";

  serialized.electronic = {
    summary: state.electronic,
    latex: state.electronic,
  };

  serialized.summary += state.electronic;
  serialized.latex += state.electronic;

  serialized.summary += "}";
  serialized.latex += "\\right)";

  return serialized;
};
