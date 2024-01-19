import { z, ZodType } from "zod";
import { ProcessInfoBase } from "../process-info-base.js";
import { UnitValue } from "../unit-value.js";
import { RateCoefficientData } from "./data-types.js";

export const EnergyRateCoefficientInfo = <ReferenceType extends z.ZodTypeAny>(
  ReferenceType: ReferenceType,
) =>
  ProcessInfoBase("EnergyRateCoefficient", RateCoefficientData, ReferenceType)
    .merge(
      z.object({
        // TODO: Should this be nonnegative, i.e. how do we treat reverse processes?
        threshold: UnitValue(z.string(), z.number()),
      }),
    );

type EnergyRateCoefficientInfoType<ReferenceType extends z.ZodTypeAny> =
  ReturnType<
    typeof EnergyRateCoefficientInfo<ReferenceType>
  >;

export type EnergyRateCoefficientInfo<ReferenceType> = z.infer<
  EnergyRateCoefficientInfoType<ZodType<ReferenceType>>
>;
