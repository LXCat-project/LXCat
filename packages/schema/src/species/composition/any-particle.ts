import { typeTag } from "../generators";
import { SimpleParticle } from "./simple/particle";

export const AnyParticle = typeTag("simple").merge(SimpleParticle);
