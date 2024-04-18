// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { object, string } from "zod";
import { makeComponent } from "../../../component.js";

const SpectroscopicElectronicDescriptor = object({
  energyId: string().min(1),
});

export const SpectroscopicElectronic = makeComponent(
  SpectroscopicElectronicDescriptor,
  (desc) => desc.energyId,
  (desc) => `\\mathrm{${desc.energyId}}`,
);
