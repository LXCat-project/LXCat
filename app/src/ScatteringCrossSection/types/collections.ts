import { VersionInfo } from "../../shared/types/version_info";
import { CSParameters } from "../types";
import { CSStorage } from "./data_types";

export type CrossSection = {
  reaction: string;
  parameters?: CSParameters;
  threshold: number;
  organization: string;
  versionInfo: VersionInfo;
} & CSStorage;
