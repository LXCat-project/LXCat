import { CSL } from "./csl";

interface SimpleReference {
  string: string;
}

export type Reference = CSL.Data | SimpleReference;
