import { VersionInfo } from "../../shared/types/version_info";
import { CSParameters } from "../types";
import { CSStorage } from "./data_types";

export type CrossSection = {
  reaction: string; // A key in Reaction collection
  parameters?: CSParameters;
  threshold: number;
  organization: string; // A key in Organization collection
  versionInfo: VersionInfo;
} & CSStorage;
