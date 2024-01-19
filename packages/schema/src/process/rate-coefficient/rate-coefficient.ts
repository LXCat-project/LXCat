import { z, ZodType } from "zod";
import { ProcessInfoBase } from "../process-info-base.js";
import { UnitValue } from "../unit-value.js";
import { RateCoefficientData } from "./data-types.js";

export const RateCoefficientInfo = <ReferenceType extends z.ZodTypeAny>(
  ReferenceType: ReferenceType,
) =>
  ProcessInfoBase("RateCoefficient", RateCoefficientData, ReferenceType).merge(
    z.object({
      // TODO: Should this be nonnegative, i.e. how do we treat reverse processes?
      threshold: UnitValue(z.string(), z.number()),
    }),
  );

type RateCoefficientInfoType<ReferenceType extends z.ZodTypeAny> = ReturnType<
  typeof RateCoefficientInfo<ReferenceType>
>;

export type RateCoefficientInfo<ReferenceType> = z.infer<
  RateCoefficientInfoType<ZodType<ReferenceType>>
>;
