// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { ProcessInfoBase } from "../process-info-base";
import { CrossSectionData } from "./data-types";

export const CrossSectionInfo = <ReferenceType extends z.ZodTypeAny>(
  ReferenceType: ReferenceType,
) => ProcessInfoBase("CrossSection", CrossSectionData, ReferenceType);
