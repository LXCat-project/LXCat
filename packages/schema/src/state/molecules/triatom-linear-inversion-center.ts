// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { z } from "zod";
import { molecule } from "../generators";
import { LinearInversionCenterElectronic } from "./components/electronic/linear-inversion-center";
import { Rotational } from "./components/rotational";
import { LinearTriatomVibrational } from "./components/vibrational/linear-triatomic";

export const LinearTriatomInversionCenter = molecule(
  "LinearTriatomInversionCenter",
  LinearInversionCenterElectronic,
  LinearTriatomVibrational,
  Rotational,
);
export type LinearTriatomInversionCenter = z.infer<
  typeof LinearTriatomInversionCenter
>;
