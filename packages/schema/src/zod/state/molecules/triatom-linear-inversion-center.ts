import { z } from "zod";
import { molecule } from "../generators";
import { LinearInversionCenterElectronicImpl } from "./components/electronic/linear-inversion-center";
import { RotationalImpl } from "./components/rotational";
import { LinearTriatomVibrationalImpl } from "./components/vibrational/linear-triatomic";

export const LinearTriatomInversionCenter = molecule(
  "LinearTriatomInversionCenter",
  LinearInversionCenterElectronicImpl,
  LinearTriatomVibrationalImpl,
  RotationalImpl,
);
export type LinearTriatomInversionCenter = z.infer<
  typeof LinearTriatomInversionCenter
>;
