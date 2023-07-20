import { z } from "zod";
import { ProcessInfoBase } from "../process-info-base";
import { CrossSectionData } from "./data-types";

export const CrossSectionInfo = <ReferenceType extends z.ZodTypeAny>(
  ReferenceType: ReferenceType,
) => ProcessInfoBase("CrossSection", CrossSectionData, ReferenceType);
