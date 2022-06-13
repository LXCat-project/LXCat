import { VersionInfo } from "../shared/types/version_info";

export interface CrossSectionSet {
  name: string;
  description: string;
  complete: boolean;
  organization: string;
  versionInfo: VersionInfo;
}
