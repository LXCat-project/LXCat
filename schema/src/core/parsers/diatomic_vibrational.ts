import { DiatomicVibrationalImpl } from "../molecules/components/vibrational/diatomic";
import { ComponentParser, PUV } from "./common";

function parse_v_dv(v: PUV<DiatomicVibrationalImpl>): string {
  return v.v.toString();
}

export const diatomicVibrationalParser: ComponentParser<
  PUV<DiatomicVibrationalImpl>
> = {
  id: parse_v_dv,
  latex: parse_v_dv,
};
