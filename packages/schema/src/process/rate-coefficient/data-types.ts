import { z } from "zod";
import { Constant, Expression, LUT } from "../../common/data-types.js";

// NOTE: Should be a discriminated union, but zod does not support discriminated
//       unions over `ZodEffects` types.
export const RateCoefficientData = z.union([
  Constant,
  LUT,
  Expression,
]);
